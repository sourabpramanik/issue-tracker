use actix_web::{
    get,
    web::{self, ServiceConfig},
    HttpRequest, HttpResponse, Responder,
};
use clerk_rs::{
    apis::users_api::User, clerk::Clerk, validators::actix::ClerkMiddleware, ClerkConfiguration,
};
use shuttle_actix_web::ShuttleActixWeb;
use shuttle_secrets::SecretStore;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

struct AppState {
    client: Clerk,
    pool: Pool<Postgres>,
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
    #[shuttle_shared_db::Postgres] db_conn_str: String,
) -> ShuttleActixWeb<impl FnOnce(&mut ServiceConfig) + Send + Clone + 'static> {
    // DB Pool
    let pool = match PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_conn_str)
        .await
    {
        Ok(pool) => {
            println!("🚀 Connection to the database is successful!");
            pool
        }
        Err(err) => {
            println!("🔥 Failed to connect to the database: {:?}", err);
            std::process::exit(1);
        }
    };

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
                .service(get_users),
        )
        .service(actix_files::Files::new("/", "./frontend/dist").index_file("index.html"))
        .app_data(state);
    };

    Ok(app_config.into())
}
