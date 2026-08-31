# Defines which status transitions are allowed and under what conditions.

VALID_STATUSES = ['Reported', 'Triaged', 'Scheduled', 'Resolved']

# Maps current status -> list of statuses it's allowed to move to
ALLOWED_TRANSITIONS = {
    'Reported': ['Triaged'],
    'Triaged': ['Scheduled', 'Reported'],
    'Scheduled': ['Resolved', 'Triaged'],
    'Resolved': ['Triaged'],  # reopening goes to Triaged, NOT back to Reported
}


def is_transition_allowed(current_status, new_status):
    """Check if moving from current_status to new_status is a valid step."""
    if new_status not in VALID_STATUSES:
        return False, f"'{new_status}' is not a valid status"

    allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_next:
        return False, f"Cannot move from '{current_status}' to '{new_status}'"

    return True, None


def check_scheduling_requirements(new_status, has_contractor_assigned):
    """Extra business rule: can't move to Scheduled without a contractor assigned."""
    if new_status == 'Scheduled' and not has_contractor_assigned:
        return False, "Cannot move to Scheduled without at least one contractor assigned"
    return True, None
