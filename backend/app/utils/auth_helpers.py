from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')

            if user_role not in allowed_roles:
                return jsonify({'error': 'You do not have permission to perform this action'}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user_id():
    return get_jwt_identity()


def get_current_user_role():
    claims = get_jwt()
    return claims.get('role')
