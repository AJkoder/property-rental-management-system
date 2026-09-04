from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Unit
from app.utils.auth_helpers import role_required, get_current_user_id, get_current_user_role
from flask_jwt_extended import jwt_required

units_bp = Blueprint('units', __name__)


@units_bp.route('/request-options', methods=['GET'])
@jwt_required()
def list_request_options():
    """Return the minimum unit data needed to report a maintenance issue.

    This keeps rent and tenant details manager-only while allowing a contractor
    to select the affected unit when creating a request.
    """
    query = Unit.query.filter_by(is_archived=False)
    if get_current_user_role() == 'manager':
        query = query.filter_by(manager_id=get_current_user_id())
    units = query.order_by(Unit.unit_number.asc()).all()
    return jsonify({
        'units': [
            {
                'id': unit.id,
                'unit_number': unit.unit_number,
                'address': unit.address,
            }
            for unit in units
        ]
    }), 200


@units_bp.route('', methods=['POST'])
@role_required('manager')
def create_unit():
    data = request.get_json()

    if not isinstance(data, dict):
        return jsonify({'error': 'No input data provided'}), 400

    unit_number = data.get('unit_number', '')
    address = data.get('address', '')
    rent_amount = data.get('rent_amount')
    tenant_name = data.get('tenant_name')
    if not isinstance(unit_number, str) or not isinstance(address, str) or (tenant_name is not None and not isinstance(tenant_name, str)):
        return jsonify({'error': 'unit_number, address, and tenant_name must be strings'}), 400

    unit_number = unit_number.strip()
    address = address.strip()
    tenant_name = tenant_name.strip() if tenant_name else None

    if not unit_number or not address or rent_amount is None:
        return jsonify({'error': 'unit_number, address, and rent_amount are required'}), 400

    try:
        rent_amount = float(rent_amount)
        if rent_amount < 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'rent_amount must be a positive number'}), 400

    unit = Unit(
        manager_id=get_current_user_id(),
        unit_number=unit_number,
        address=address,
        rent_amount=rent_amount,
        tenant_name=tenant_name
    )
    db.session.add(unit)
    db.session.commit()

    return jsonify({'message': 'Unit created', 'unit': unit.to_dict()}), 201


@units_bp.route('', methods=['GET'])
@role_required('manager')
def list_units():
    include_archived = request.args.get('include_archived', 'false').lower() == 'true'

    query = Unit.query.filter_by(manager_id=get_current_user_id())
    if not include_archived:
        query = query.filter_by(is_archived=False)

    units = query.order_by(Unit.created_at.desc()).all()
    return jsonify({'units': [u.to_dict() for u in units]}), 200


@units_bp.route('/<unit_id>', methods=['GET'])
@role_required('manager')
def get_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit or unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Unit not found'}), 404
    return jsonify({'unit': unit.to_dict()}), 200


@units_bp.route('/<unit_id>', methods=['PUT'])
@role_required('manager')
def update_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit or unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Unit not found'}), 404

    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({'error': 'No input data provided'}), 400

    if 'unit_number' in data:
        if not isinstance(data['unit_number'], str) or not data['unit_number'].strip():
            return jsonify({'error': 'unit_number must be a non-empty string'}), 400
        unit.unit_number = data['unit_number'].strip()
    if 'address' in data:
        if not isinstance(data['address'], str) or not data['address'].strip():
            return jsonify({'error': 'address must be a non-empty string'}), 400
        unit.address = data['address'].strip()
    if 'tenant_name' in data:
        tenant_name = data['tenant_name']
        if tenant_name is not None and not isinstance(tenant_name, str):
            return jsonify({'error': 'tenant_name must be a string or null'}), 400
        unit.tenant_name = tenant_name.strip() if tenant_name else None
    if 'rent_amount' in data:
        try:
            rent = float(data['rent_amount'])
            if rent < 0:
                raise ValueError
            unit.rent_amount = rent
        except (TypeError, ValueError):
            return jsonify({'error': 'rent_amount must be a positive number'}), 400

    db.session.commit()
    return jsonify({'message': 'Unit updated', 'unit': unit.to_dict()}), 200


@units_bp.route('/<unit_id>/archive', methods=['PATCH'])
@role_required('manager')
def archive_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit or unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Unit not found'}), 404

    unit.is_archived = True
    db.session.commit()
    return jsonify({'message': 'Unit archived', 'unit': unit.to_dict()}), 200


@units_bp.route('/<unit_id>/restore', methods=['PATCH'])
@role_required('manager')
def restore_unit(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit or unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Unit not found'}), 404

    unit.is_archived = False
    db.session.commit()
    return jsonify({'message': 'Unit restored', 'unit': unit.to_dict()}), 200
