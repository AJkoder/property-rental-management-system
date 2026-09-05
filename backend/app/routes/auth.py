from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User
from app.utils.auth_helpers import role_required
from app.services.demo_data import ensure_documented_demo_data
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

VALID_ROLES = ['manager', 'contractor']

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not isinstance(data, dict):
        return jsonify({'error': 'No input data provided'}), 400

    name = data.get('name', '')
    email = data.get('email', '')
    password = data.get('password', '')
    role = data.get('role', '')

    if not all(isinstance(value, str) for value in (name, email, password, role)):
        return jsonify({'error': 'name, email, password, and role must be strings'}), 400

    name = name.strip()
    email = email.strip().lower()
    role = role.strip().lower()

    if not name or not email or not password or not role:
        return jsonify({'error': 'name, email, password, and role are all required'}), 400

    if role not in VALID_ROLES:
        return jsonify({'error': f'role must be one of {VALID_ROLES}'}), 400

    if len(password) < 6:
        return jsonify({'error': 'password must be at least 6 characters'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'An account with this email already exists'}), 409

    user = User(name=name, email=email, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}
    )

    return jsonify({
        'message': 'Account created successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not isinstance(data, dict):
        return jsonify({'error': 'No input data provided'}), 400

    email = data.get('email', '')
    password = data.get('password', '')

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({'error': 'email and password must be strings'}), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if user.email in ('manager@test.com', 'ramesh@test.com'):
        ensure_documented_demo_data()
        db.session.commit()

    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}
    )

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    from flask_jwt_extended import jwt_required
    from app.utils.auth_helpers import get_current_user_id, get_current_user_role

    @jwt_required()
    def _inner():
        return jsonify({'user_id': get_current_user_id(), 'role': get_current_user_role()}), 200

    return _inner()


@auth_bp.route('/contractors', methods=['GET'])
@role_required('manager')
def list_contractors():
    contractors = User.query.filter_by(role='contractor').order_by(User.name.asc()).all()
    return jsonify({
        'contractors': [{'id': contractor.id, 'name': contractor.name} for contractor in contractors]
    }), 200
