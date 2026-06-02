import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { type, ...payload } = body;

    // Upsert into PaymentRecord via service role
    const records = await base44.asServiceRole.entities.PaymentRecord.filter(
      payload.civil_id ? { civil_id: payload.civil_id } : {}
    );

    let record;
    if (records && records.length > 0) {
      record = await base44.asServiceRole.entities.PaymentRecord.update(records[0].id, payload);
    } else {
      record = await base44.asServiceRole.entities.PaymentRecord.create(payload);
    }

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});