import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import {
  AdminEmpty,
  AdminField,
  AdminFormGrid,
  AdminLoading,
  AdminNotice,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminRecord,
  AdminRecordList,
  AdminStatusBadge,
} from './AdminPrimitives.jsx';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const parseAreas = (text) => [
  ...new Set(
    text
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  ),
];

export default function DeliveryOptionsAdmin() {
  const [options, setOptions] = useState(null);
  const [slots, setSlots] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'delivery', zone: '', fee: 0 });

  function load() {
    supabase
      .from('delivery_option')
      .select('*')
      .order('sort_order')
      .order('name')
      .then(({ data, error }) => setOptions(error ? [] : data));
    supabase
      .from('delivery_slot')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => setSlots(error ? [] : data));
    supabase
      .from('ordering_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => setSettings(data));
  }
  useEffect(load, []);

  async function run(promise, success) {
    const { error } = await promise;
    if (error) toast.error('That change was not saved', { description: error.message });
    else if (success) toast.success(success);
    load();
  }

  async function addOption(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await run(
      supabase.from('delivery_option').insert({
        name: form.name.trim(),
        type: form.type,
        zone: form.zone || null,
        fee: Number(form.fee) || 0,
        fee_confirmed: form.type === 'pickup',
      }),
      'Option added',
    );
    setForm({ name: '', type: 'delivery', zone: '', fee: 0 });
  }

  const updateOption = (opt, patch) => run(supabase.from('delivery_option').update(patch).eq('id', opt.id));
  const updateSlot = (slot, patch) => run(supabase.from('delivery_slot').update(patch).eq('code', slot.code));
  const updateSettings = (patch) => run(supabase.from('ordering_settings').update(patch).eq('id', true), 'Rules saved');

  async function deleteOption(opt) {
    const { error } = await supabase.from('delivery_option').delete().eq('id', opt.id);
    if (error) toast.error('Option not deleted', { description: 'Past orders use it. Mark it inactive instead.' });
    load();
  }

  const toggleWeekday = (day) => {
    const open = new Set(settings.open_weekdays);
    if (open.has(day)) open.delete(day);
    else open.add(day);
    updateSettings({ open_weekdays: [...open].sort() });
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Delivery and time slots"
        description="Delivery areas, their fees, the three daily time slots, and the booking rules checkout enforces."
      />

      <AdminPanel title="Time slots" description="Customers book one of these windows per day. Leave capacity empty for no limit.">
        {slots === null ? (
          <AdminLoading label="Loading slots…" />
        ) : (
          <AdminRecordList>
            {slots.map((slot) => (
              <AdminRecord key={slot.code}>
                <div className="admin-record__summary">
                  <strong>{slot.label}</strong>
                  <AdminStatusBadge status={slot.active ? 'active' : 'inactive'}>{slot.active ? 'Bookable' : 'Hidden'}</AdminStatusBadge>
                </div>
                <AdminFormGrid>
                  <AdminField label="Label">
                    <input
                      defaultValue={slot.label}
                      onBlur={(e) =>
                        e.target.value.trim() && e.target.value !== slot.label && updateSlot(slot, { label: e.target.value.trim() })
                      }
                    />
                  </AdminField>
                  <AdminField label="Starts">
                    <input
                      type="time"
                      defaultValue={slot.start_time.slice(0, 5)}
                      onBlur={(e) =>
                        e.target.value && e.target.value !== slot.start_time.slice(0, 5) && updateSlot(slot, { start_time: e.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Ends">
                    <input
                      type="time"
                      defaultValue={slot.end_time.slice(0, 5)}
                      onBlur={(e) =>
                        e.target.value && e.target.value !== slot.end_time.slice(0, 5) && updateSlot(slot, { end_time: e.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Orders per day" hint="Empty = unlimited">
                    <input
                      type="number"
                      min="1"
                      defaultValue={slot.capacity ?? ''}
                      onBlur={(e) => updateSlot(slot, { capacity: e.target.value === '' ? null : Math.max(1, Number(e.target.value)) })}
                    />
                  </AdminField>
                </AdminFormGrid>
                <div className="admin-record__actions">
                  <button type="button" onClick={() => updateSlot(slot, { active: !slot.active })} className="btn btn-secondary btn-sm">
                    {slot.active ? 'Hide this slot' : 'Make bookable'}
                  </button>
                </div>
              </AdminRecord>
            ))}
          </AdminRecordList>
        )}
      </AdminPanel>

      <AdminPanel title="Booking rules" description="Enforced by the database, so they hold even if someone bypasses the website.">
        {settings === null ? (
          <AdminLoading label="Loading rules…" />
        ) : (
          <>
            <AdminFormGrid>
              <AdminField label="Notice needed (hours)" hint="Measured to the START of the slot. No same-day orders at 24.">
                <input
                  type="number"
                  min="0"
                  defaultValue={settings.lead_hours}
                  onBlur={(e) =>
                    Number(e.target.value) !== settings.lead_hours &&
                    updateSettings({ lead_hours: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </AdminField>
              <AdminField label="Book up to (days ahead)">
                <input
                  type="number"
                  min="1"
                  max="365"
                  defaultValue={settings.max_advance_days}
                  onBlur={(e) =>
                    Number(e.target.value) !== settings.max_advance_days &&
                    updateSettings({ max_advance_days: Math.min(365, Math.max(1, Number(e.target.value) || 1)) })
                  }
                />
              </AdminField>
              <AdminField label="Hold unpaid orders (minutes)" hint="How long an unpaid checkout keeps its slot.">
                <input
                  type="number"
                  min="0"
                  defaultValue={settings.hold_minutes}
                  onBlur={(e) =>
                    Number(e.target.value) !== settings.hold_minutes &&
                    updateSettings({ hold_minutes: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </AdminField>
            </AdminFormGrid>
            <fieldset className="admin-weekdays">
              <legend>Open days</legend>
              {WEEKDAYS.map((day) => (
                <label key={day.value}>
                  <input type="checkbox" checked={settings.open_weekdays.includes(day.value)} onChange={() => toggleWeekday(day.value)} />
                  <span>{day.label}</span>
                </label>
              ))}
            </fieldset>
          </>
        )}
      </AdminPanel>

      <AdminNotice>
        Delivery fees: leave <strong>Fee confirmed</strong> set to No while you are still deciding a price. Customers then pay for their
        bakes online and you confirm the fee with them on WhatsApp. Set it to Yes and the fee is added to what they pay.
      </AdminNotice>
      <AdminPanel title="Pickup and delivery areas" description={options ? `${options.length} options configured` : 'Loading'}>
        {options === null ? (
          <AdminLoading label="Loading delivery options…" />
        ) : options.length ? (
          <AdminRecordList>
            {options.map((o) => (
              <AdminRecord key={o.id}>
                <div className="admin-record__summary">
                  <strong>{o.name}</strong>
                  <AdminStatusBadge status={o.active ? 'active' : 'inactive'}>{o.active ? 'Active' : 'Inactive'}</AdminStatusBadge>
                  {o.type === 'delivery' && <span>{o.fee_confirmed ? fmtNaira(o.fee) : 'Fee to be confirmed'}</span>}
                </div>
                <AdminFormGrid>
                  <AdminField label="Name">
                    <input
                      defaultValue={o.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== o.name && updateOption(o, { name: e.target.value.trim() })}
                    />
                  </AdminField>
                  <AdminField label="Type">
                    <select defaultValue={o.type} onChange={(e) => updateOption(o, { type: e.target.value })}>
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </AdminField>
                  {o.type === 'delivery' && (
                    <>
                      <AdminField label="Fee (₦)">
                        <input
                          type="number"
                          min="0"
                          defaultValue={o.fee}
                          onBlur={(e) =>
                            Number(e.target.value) !== o.fee && updateOption(o, { fee: Math.max(0, Number(e.target.value) || 0) })
                          }
                        />
                      </AdminField>
                      <AdminField label="Fee confirmed" hint="No = confirm by WhatsApp">
                        <select
                          value={o.fee_confirmed ? 'yes' : 'no'}
                          onChange={(e) => updateOption(o, { fee_confirmed: e.target.value === 'yes' })}
                        >
                          <option value="no">No, confirm on WhatsApp</option>
                          <option value="yes">Yes, charge it online</option>
                        </select>
                      </AdminField>
                      <AdminField label="Description" hint="Shown to customers">
                        <input
                          defaultValue={o.description || ''}
                          onBlur={(e) =>
                            e.target.value !== (o.description || '') && updateOption(o, { description: e.target.value || null })
                          }
                        />
                      </AdminField>
                      <AdminField label="Order" hint="Smaller shows first">
                        <input
                          type="number"
                          defaultValue={o.sort_order}
                          onBlur={(e) =>
                            Number(e.target.value) !== o.sort_order && updateOption(o, { sort_order: Number(e.target.value) || 0 })
                          }
                        />
                      </AdminField>
                    </>
                  )}
                </AdminFormGrid>
                {o.type === 'delivery' && (
                  <AdminField
                    label="Neighbourhoods"
                    hint="One per line or comma-separated. Leave empty to let customers type their own (for an 'Other areas' option)."
                  >
                    <textarea
                      rows={3}
                      defaultValue={(o.areas || []).join('\n')}
                      onBlur={(e) => {
                        const next = parseAreas(e.target.value);
                        if (next.join('|') !== (o.areas || []).join('|')) updateOption(o, { areas: next });
                      }}
                    />
                  </AdminField>
                )}
                <div className="admin-record__actions">
                  <button type="button" onClick={() => updateOption(o, { active: !o.active })} className="btn btn-secondary btn-sm">
                    Mark {o.active ? 'inactive' : 'active'}
                  </button>
                  <ConfirmAlertDialog
                    trigger={
                      <button type="button" className="btn btn-secondary btn-sm">
                        Delete
                      </button>
                    }
                    title={`Delete ${o.name}?`}
                    description="Only options with no past orders can be deleted. Otherwise mark it inactive."
                    confirmLabel="Delete option"
                    onConfirm={() => deleteOption(o)}
                  />
                </div>
              </AdminRecord>
            ))}
          </AdminRecordList>
        ) : (
          <AdminEmpty>No delivery or pickup options configured.</AdminEmpty>
        )}
      </AdminPanel>

      <form onSubmit={addOption}>
        <AdminPanel title="Add an option" description="Add neighbourhoods and a fee after creating it.">
          <AdminFormGrid>
            <AdminField label="Name">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Abeokuta North" />
            </AdminField>
            <AdminField label="Type">
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </AdminField>
            <AdminField label="Zone label" hint="Optional">
              <input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} placeholder="North" />
            </AdminField>
            <AdminField label="Fee (₦)">
              <input type="number" min="0" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} />
            </AdminField>
          </AdminFormGrid>
          <div className="admin-panel__footer">
            <button type="submit" className="btn btn-primary">
              Add option
            </button>
          </div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
