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
    id: i32,
    title: String,
    description: String,
    status: String,
    label: String,
    author: String,
}

#[derive(Serialize, Deserialize, FromRow, Debug)]
struct NewTask {
    title: String,
    description: String,
    status: String,
    label: String,
    author: String,
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
async fn add_task(payload: web::Json<NewTask>, state: web::Data<AppState>) -> impl Responder {
    let query: Result<Task, sqlx::Error> = sqlx::query_as(
        "INSERT INTO Task (title, description, status, label, author) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.status)
    .bind(&payload.label)
    .bind(&payload.author)
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

#[get("/user/self")]
async fn get_user_self(state: web::Data<AppState>, req: HttpRequest) -> impl Responder {
    let srv_req = ServiceRequest::from_request(req);

    let claim = match clerk_authorize(&srv_req, &state.client, true).await {
        Ok(value) => value.1,
        Err(_) => {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "status":"Failed",
                "message":"Unauthorized"
            }));
        }
    };

    let Ok(user) = User::get_user(&state.client, &claim.sub).await else {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "status": "FAILED",
            "message": "Unable to retrieve all users",
        }));
    };

    HttpResponse::Ok().json(serde_json::json!({
        "id": &user.id,
        "first_name": &user.first_name,
        "last_name": &user.last_name,
        "username": &user.username,
        "avatar": &user.profile_image_url
    }))
}

#[get("/user/{user_id}")]
async fn get_user(state: web::Data<AppState>, path: web::Path<String>) -> impl Responder {
    let user_id = path.into_inner();
    let Ok(user) = User::get_user(&state.client, &user_id).await else {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "status": "FAILED",
            "message": "Unable to retrieve all users",
        }));
    };

    HttpResponse::Ok().json(serde_json::json!({
        "id": &user.id,
        "first_name": &user.first_name,
        "last_name": &user.last_name,
        "username": &user.username,
        "avatar": &user.profile_image_url
    }))
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
                .service(get_user_self)
                .service(get_user)
                .service(get_tasks)
                .service(add_task),
        )
        .service(actix_files::Files::new("/", "./frontend/dist").index_file("index.html"))
        .app_data(state);
    };

    Ok(app_config.into())
}
