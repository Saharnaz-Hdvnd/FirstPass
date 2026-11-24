"""Standalone MarketCheck search/export helper. Original notebook is not modified."""
import argparse
import datetime as dt
import getpass
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request


def ask_int(label, default, minimum=0, maximum=None):
    while True:
        raw = input(f"{label} [{default}]: ").strip() or str(default)
        try:
            value = int(raw)
            if value < minimum or (maximum is not None and value > maximum):
                raise ValueError
            return value
        except ValueError:
            print("Enter a whole number within the stated search limits.")


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=Path(__file__).resolve().parent / 'vehicle_search_results')
    args = parser.parse_args()
    print("Vehicle search: requests up to 50 used-car advertisements from MarketCheck.")
    print("This uses your MarketCheck quota. It does not call Gemini or start a server.")
    zip_code = input("Five-digit ZIP code: ").strip()
    if len(zip_code) != 5 or not zip_code.isascii() or not zip_code.isdigit():
        raise SystemExit("A five-digit US ZIP code is required.")
    make = input("Make (for example, Toyota): ").strip()
    model = input("Model (for example, Corolla): ").strip()
    if not make or not model:
        raise SystemExit("Make and model are required.")
    trim = input("Trim (leave blank for any): ").strip()
    radius = ask_int("Radius in miles, 1–100", 50, 1, 100)
    year_min = ask_int("Minimum year", 2021, 1900, 2100)
    year_max = ask_int("Maximum year", 2024, year_min, 2100)
    price_max = ask_int("Maximum price in dollars", 40000, 1)
    miles_max = ask_int("Maximum mileage", 60000, 0)
    key = os.environ.get('MARKETCHECK_API_KEY', '').strip()
    if not key:
        key = getpass.getpass("MarketCheck API key (hidden; not saved): ").strip()
    if not key:
        raise SystemExit("No API key provided. No request was sent.")
    params = dict(api_key=key, car_type='used', make=make, model=model,
                  year_range=f'{year_min}-{year_max}', zip=zip_code, radius=radius,
                  price_range=f'0-{price_max}', miles_range=f'0-{miles_max}',
                  rows=50, sort_by='dist', sort_order='asc', has_price='true', has_miles='true')
    if trim:
        params['trim'] = trim
    url = 'https://api.marketcheck.com/v2/search/car/active?' + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.load(response)
    except urllib.error.HTTPError as exc:
        hints = {401: 'Check your API key.', 403: 'Check API access and plan permissions.',
                 429: 'The provider rate or quota limit was reached.'}
        raise SystemExit(f'MarketCheck returned HTTP {exc.code}. ' + hints.get(exc.code, 'Check provider access and search parameters.')) from None
    except (urllib.error.URLError, TimeoutError):
        raise SystemExit('Could not reach MarketCheck. Check your connection and try again.') from None
    except (ValueError, UnicodeError):
        raise SystemExit('The provider response could not be read as JSON.') from None
    if not isinstance(data, dict) or not isinstance(data.get('listings'), list):
        raise SystemExit('The provider did not return a listings array. No results were exported.')
    captured = dt.datetime.now(dt.timezone.utc)
    public_filters = {k: v for k, v in params.items() if k != 'api_key'}
    rows = []
    for i, item in enumerate(data['listings'], 1):
        if not isinstance(item, dict):
            continue
        build = item.get('build') or {}
        dealer = item.get('dealer') or {}
        if not isinstance(build, dict): build = {}
        if not isinstance(dealer, dict): dealer = {}
        rows.append(dict(result_number=i, listing_id=item.get('id'), vin=item.get('vin'),
            year=build.get('year'), make=build.get('make'), model=build.get('model'), trim=build.get('trim'),
            heading=item.get('heading'), price=item.get('price'), mileage=item.get('miles'),
            distance_miles=item.get('dist'), dealer=dealer.get('name'), listing_url=item.get('vdp_url')))
    # Defense in depth: do not persist a credential if the provider echoes it.
    payload = dict(captured_at_utc=captured.isoformat(), endpoint='/v2/search/car/active',
                   filters=public_filters, total_matches_reported=data.get('num_found'),
                   returned_count=len(rows), vehicles=rows, raw_provider_response=data,
                   limitations=['One page of up to 50 results; not all matching inventory.',
                                'Provider advertisement data; no independent trustworthiness verification.'])
    serialized = json.dumps(payload, ensure_ascii=False, indent=2).replace(key, '[REDACTED]')
    args.output_dir.mkdir(parents=True, exist_ok=True)
    stamp = captured.strftime('%Y%m%dT%H%M%S%fZ')
    target = args.output_dir / f'vehicle_listings_{stamp}.json'
    target.write_text(serialized, encoding='utf-8')
    print(f"\nReturned {len(rows)} listings. Provider reports {data.get('num_found', 'unknown')} total matches.")
    for row in rows:
        name = row.get('heading') or ' '.join(str(row.get(k) or '') for k in ('year', 'make', 'model', 'trim')).strip()
        print(f"\n{row['result_number']}. {name or 'Vehicle details unavailable'}")
        print(f"   Price: {row['price']} | Mileage: {row['mileage']} | Dealer: {row['dealer']}")
        print(f"   VIN: {row['vin']}\n   Listing: {row['listing_url']}")
    print(f'\nSaved results: {target}')
    if not rows:
        print('No matching listings returned. Consider adjusting the filters.')


if __name__ == '__main__':
    run()
