-- Additive: fire shipment_published on INSERT when is_published is already true.
--
-- The existing shipment_notification_event_trigger fires BEFORE UPDATE only, so
-- a row inserted with is_published=true never queues a shipment_published event.
-- This migration closes that gap with a dedicated AFTER INSERT trigger that uses
-- the same idempotency key as the UPDATE path ('<id>:shipment_published').
-- ON CONFLICT DO NOTHING therefore guarantees exactly one event even if both
-- triggers somehow fire (e.g., when the UPDATE trigger is later changed to also
-- cover inserts).

CREATE OR REPLACE FUNCTION public.queue_published_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when the shipment is inserted already in the published state.
  IF NOT NEW.is_published THEN
    RETURN NEW;
  END IF;

  -- Set published_at if the caller left it NULL.
  UPDATE public.shipments
  SET published_at = COALESCE(NEW.published_at, NOW())
  WHERE id = NEW.id
    AND published_at IS NULL;

  -- Queue the publication notification.  The idempotency key is identical to
  -- the key used by record_shipment_notification_events() on UPDATE, so a
  -- duplicate cannot be inserted even if both triggers fire.
  PERFORM public.queue_notification_event(
    NEW.id,
    'shipment_published',
    NEW.id::TEXT || ':shipment_published',
    jsonb_build_object('published_at', COALESCE(NEW.published_at, NOW()))
  );

  RETURN NEW;
END;
$$;

-- This trigger fires AFTER the row exists (so the FK from notification_events
-- to shipments is satisfied) and runs only on INSERT.
DROP TRIGGER IF EXISTS shipment_publish_on_insert_trigger ON public.shipments;
CREATE TRIGGER shipment_publish_on_insert_trigger
AFTER INSERT ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.queue_published_on_insert();

-- Lock down the new function the same way as the other server-only helpers.
REVOKE ALL ON FUNCTION public.queue_published_on_insert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_published_on_insert() TO service_role;
