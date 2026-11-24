"""Conditional evidence score. Unknown checks are excluded, not penalized."""
import math


def aggregate(checks, minimum_coverage=50, minimum_categories=3):
    if not 0 <= minimum_coverage <= 100 or not 1 <= minimum_categories <= 6:
        raise ValueError('Invalid display policy')
    seen = set(); totals = {'supported':0.0,'contradicted':0.0,'unknown':0.0}; categories=set()
    for check in checks:
        rid, state, weight = check['id'], check['state'], check['weight']
        if rid in seen or state not in totals or isinstance(weight,bool) or not isinstance(weight,(int,float)) or not math.isfinite(weight) or weight <= 0:
            raise ValueError('Invalid or duplicate check')
        seen.add(rid); totals[state] += weight
        if state != 'unknown': categories.add(rid[0])
    if not math.isclose(sum(totals.values()),100,abs_tol=1e-8):
        raise ValueError('Applicable normalized weights must total 100')
    coverage = totals['supported'] + totals['contradicted']
    conditional = 100 * totals['supported'] / coverage if coverage else None
    eligible = coverage >= minimum_coverage and len(categories) >= minimum_categories
    return {**totals,'coverage':coverage,'checked_categories':len(categories),
            'conditional_score':conditional,'score':round(conditional,1) if eligible else None,
            'status':'provisional_score' if eligible else 'insufficient_evidence',
            'display_policy':{'minimum_coverage':minimum_coverage,'minimum_categories':minimum_categories,
                              'validated':False,'note':'Provisional research display gate, not an established safety threshold.'}}
