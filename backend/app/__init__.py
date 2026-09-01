from flask import Flask
from app.config import Config
from app.extensions import db, jwt, cors, migrate, bcrypt
from app.models import User, Unit, MaintenanceRequest, Assignment, StatusHistory, Payment, Alert

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.units import units_bp
    from app.routes.maintenance_requests import requests_bp
    from app.routes.assignments import assignments_bp
    from app.routes.payments import payments_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.alerts import alerts_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(units_bp, url_prefix='/api/units')
    app.register_blueprint(requests_bp, url_prefix='/api/requests')
    app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    return app
