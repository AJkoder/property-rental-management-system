import os
import unittest
from datetime import datetime, timezone


# Must be configured before importing the application factory.
os.environ['DATABASE_URL'] = 'sqlite://'

from flask_jwt_extended import create_access_token

from app import create_app
from app.extensions import db
from app.models import Unit, User


class PaymentInstallmentTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        self.manager = User(
            name='Test Manager',
            email='manager@example.com',
            role='manager',
        )
        self.manager.set_password('test-password')
        db.session.add(self.manager)
        db.session.flush()

        self.unit = Unit(
            manager_id=self.manager.id,
            unit_number='A-101',
            address='Test address',
            rent_amount=15000,
            tenant_name='Test Tenant',
        )
        db.session.add(self.unit)
        db.session.commit()

        token = create_access_token(
            identity=self.manager.id,
            additional_claims={'role': 'manager'},
        )
        self.client = self.app.test_client()
        self.headers = {'Authorization': f'Bearer {token}'}
        self.month = datetime.now(timezone.utc).strftime('%Y-%m')

    def test_manager_can_log_in(self):
        response = self.client.post('/api/auth/login', json={
            'email': 'manager@example.com',
            'password': 'test-password',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['user']['role'], 'manager')
        self.assertTrue(response.get_json()['access_token'])

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def test_installments_are_classified_by_their_monthly_total(self):
        first = self.client.post(
            '/api/payments/bulk',
            json={'payments': [{
                'unit_id': self.unit.id,
                'amount_paid': 13000,
                'month_covered': self.month,
            }]},
            headers=self.headers,
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(first.get_json()['summary']['underpaid'], 1)

        second = self.client.post(
            '/api/payments/bulk',
            json={'payments': [{
                'unit_id': self.unit.id,
                'amount_paid': 2000,
                'month_covered': self.month,
            }]},
            headers=self.headers,
        )
        self.assertEqual(second.status_code, 201)
        self.assertEqual(second.get_json()['summary']['matched'], 1)

        payments = self.client.get('/api/payments', headers=self.headers).get_json()['payments']
        self.assertEqual(len(payments), 2)
        self.assertEqual({payment['match_status'] for payment in payments}, {'matched'})

        dashboard = self.client.get('/api/dashboard/summary', headers=self.headers).get_json()
        self.assertEqual(dashboard['rent']['total_collected_this_month'], 15000)
        self.assertEqual(dashboard['rent']['underpaid_count'], 0)


if __name__ == '__main__':
    unittest.main()
