import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { record_id, ...payload } = body;

    let record;
    if (record_id) {
      record = await base44.asServiceRole.entities.PaymentRecord.update(record_id, payload);
    } else {
      record = await base44.asServiceRole.entities.PaymentRecord.create(payload);
    }

    return Response.json({ success: true, data: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});