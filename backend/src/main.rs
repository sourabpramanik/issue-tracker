use actix_web::{
    dev::ServiceRequest,
    get, post,
    web::{self, ServiceConfig},
    HttpRequest, HttpResponse, Responder,
};
use clerk_rs::{
    apis::users_api::User,
    clerk::Clerk,
    validators::actix::{clerk_authorize, ClerkMiddleware},
    ClerkConfiguration,
};
use serde::{Deserialize, Serialize};
use shuttle_actix_web::ShuttleActixWeb;
use shuttle_runtime::CustomError;
use shuttle_secrets::SecretStore;
use sqlx::{Executor, FromRow, PgPool};

struct AppState {
    client: Clerk,
    pool: PgPool,
}

#[derive(Serialize, Deserialize, FromRow)]
struct Task {
    id: String,
    title: String,
    description: String,
    status: String,
    lable: String,
    author: String,
}

#[derive(Serialize, Deserialize, FromRow)]
struct NewTask {
    title: String,
    description: String,
    status: String,
    lable: String,
}

#[get("/tasks")]
async fn get_tasks(state: web::Data<AppState>) -> impl Responder {
    let query: Result<Vec<Task>, sqlx::Error> = sqlx::query_as("SELECT * FROM Task")
        .fetch_all(&state.pool)
        .await;

    let tasks = match query {
        Ok(value) => value,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "FAILED",
                "message": e.to_string(),
            }));
        }
    };

    HttpResponse::Ok().json(tasks)
}

#[post("/task")]
async fn add_task(
    payload: web::Json<NewTask>,
    state: web::Data<AppState>,
    req: HttpRequest,
) -> impl Responder {
    let srv_req = ServiceRequest::from_request(req);

    let (_, claim) = match clerk_authorize(&srv_req, &state.client, true).await {
        Ok(value) => value,
        Err(_) => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "status":"Failed",
                "message":"Unauthorized"
            }));
        }
    };

    let query: Result<Task, sqlx::Error> = sqlx::query_as(
        "INSERT INTO Task(title, description, status, lable, author) VALUES ($1, $2, $3, $, $5) RETURNING id, title, description, status, lable, author",
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.status)
    .bind(&payload.lable)
    .bind(&claim.sub)
    .fetch_one(&state.pool)
    .await;

    if query.is_err() {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "status":"FAILED",
            "message":"Failed to create a task"
        }));
    }

    HttpResponse::Ok().json(serde_json::json!({}))
}

#[get("/users")]
async fn get_users(state: web::Data<AppState>, _req: HttpRequest) -> impl Responder {
    let Ok(all_users) = User::get_user_list(
        &state.client,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .await
    else {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "status": "FAILED",
            "message": "Unable to retrieve all users",
        }));
    };

    HttpResponse::Ok().json(
        all_users, /* .into_iter().map(|u| u.id).collect::<Vec<_>>() */
    )
}

#[shuttle_runtime::main]
async fn actix_web(
    #[shuttle_secrets::Secrets] secrets: SecretStore,
    #[shuttle_shared_db::Postgres] pool: PgPool,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    // DB Pool
    pool.execute(include_str!("../schema.sql"))
        .await
        .map_err(CustomError::new)?;

    // Clerk integration
    let clerk_secret_key = secrets
        .get("CLERK_SECRET_KEY")
        .expect("Clerk Secret key is not set");
    let clerk_config = ClerkConfiguration::new(None, None, Some(clerk_secret_key), None);
    let client = Clerk::new(clerk_config.clone());

    // Create new app state
    let state = web::Data::new(AppState { client, pool });

    let app_config = move |cfg: &mut ServiceConfig| {
        cfg.service(
            web::scope("/api")
                .wrap(ClerkMiddleware::new(clerk_config, None, true))
                .service(get_users)
                .service(get_tasks)
                .service(add_task),
        )
        .service(actix_files::Files::new("/", "./frontend/dist").index_file("index.html"))
        .app_data(state);
    };

    Ok(app_config.into())
}
