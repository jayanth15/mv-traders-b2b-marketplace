from sqlmodel import Session, select
from models import Product, ProductZoneAdjustment, ProductQuantityTier
from typing import Optional, Dict, Any

def compute_price(session: Session, product_id: int, quantity: int, zone_code: Optional[str]) -> Dict[str, Any]:
    """Compute pricing for a product given quantity and zone.
    Returns dict with keys: base_price, zone_adjustment, tier_discount, unit_price, applied_zone, applied_tier.
    """
    product = session.get(Product, product_id)
    if not product:
        raise ValueError("Product not found")
    base_price = product.price
    price = base_price

    applied_zone = None
    applied_tier = None

    # Zone adjustment
    if zone_code:
        zone = session.exec(
            select(ProductZoneAdjustment)
            .where(ProductZoneAdjustment.product_id == product_id)
            .where(ProductZoneAdjustment.zone_code == zone_code)
            .where(ProductZoneAdjustment.active == True)
        ).first()
        if zone:
            applied_zone = zone
            if zone.adjustment_type == 'Percent':
                price = price * (1 + zone.amount / 100.0)
            elif zone.adjustment_type == 'Absolute':
                price = price + zone.amount

    # Quantity tier
    tier = session.exec(
        select(ProductQuantityTier)
        .where(ProductQuantityTier.product_id == product_id)
        .where(ProductQuantityTier.min_qty <= quantity)
        .where(ProductQuantityTier.active == True)
        .order_by(ProductQuantityTier.min_qty.desc())
    ).first()
    if tier:
        applied_tier = tier
        if tier.discount_type == 'Percent':
            price = price * (1 - tier.discount_amount / 100.0)
        elif tier.discount_type == 'Absolute':
            price = price - tier.discount_amount

    # Clamp
    if price < 0:
        price = 0

    # Round to 2 decimals
    unit_price = round(price, 2)

    return {
        'base_price': base_price,
        'unit_price': unit_price,
        'zone_adjustment': applied_zone.amount if applied_zone else None,
        'zone_adjustment_type': applied_zone.adjustment_type if applied_zone else None,
        'tier_discount': applied_tier.discount_amount if applied_tier else None,
        'tier_discount_type': applied_tier.discount_type if applied_tier else None,
        'applied_zone_code': applied_zone.zone_code if applied_zone else None,
        'applied_tier_min_qty': applied_tier.min_qty if applied_tier else None,
        'pricing_source': 'Auto'
    }
