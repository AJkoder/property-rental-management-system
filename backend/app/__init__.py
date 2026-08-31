from flask import Flask
from app.config import Config
from app.extensions import db, jwt, cors

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    # Blueprints will be registered here as we build them
    # from app.routes.auth import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    return app