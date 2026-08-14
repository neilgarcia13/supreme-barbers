<x-mail::message>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="margin-bottom: 28px; border-collapse: collapse;">
    <tr>
      <td style="border-left: 4px solid #d6a34a; background-color: #f8f3e9; padding: 24px;">
        <p
          style="margin: 0 0 8px; color: #8a5a18; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
          Supreme Barbers
        </p>
        <h1
          style="margin: 0 0 10px; color: #211d18; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25;">
          Your reservation is confirmed.
        </h1>
        <p style="margin: 0; color: #625b52; font-size: 15px; line-height: 1.6;">
          Review your reservation details below.
        </p>
      </td>
    </tr>
  </table>

  Hello {{ $customerName }},

  Your one-hour reservation at Supreme Barbers has been successfully confirmed.

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="margin: 24px 0; border: 1px solid #ded5c8; border-collapse: collapse; background-color: #fffdf9;">
    <tr>
      <td
        style="width: 32%; border-bottom: 1px solid #e8e0d5; padding: 14px 16px; color: #746b60; font-size: 13px; font-weight: 600; text-transform: uppercase;">
        Barber
      </td>
      <td
        style="border-bottom: 1px solid #e8e0d5; padding: 14px 16px; color: #211d18; font-size: 15px; font-weight: 700;">
        {{ $barberName }}
      </td>
    </tr>
    <tr>
      <td
        style="width: 32%; border-bottom: 1px solid #e8e0d5; padding: 14px 16px; color: #746b60; font-size: 13px; font-weight: 600; text-transform: uppercase;">
        Date
      </td>
      <td
        style="border-bottom: 1px solid #e8e0d5; padding: 14px 16px; color: #211d18; font-size: 15px; font-weight: 700;">
        {{ $date }}
      </td>
    </tr>
    <tr>
      <td
        style="width: 32%; padding: 14px 16px; color: #746b60; font-size: 13px; font-weight: 600; text-transform: uppercase;">
        Time
      </td>
      <td style="padding: 14px 16px; color: #211d18; font-size: 15px; font-weight: 700;">
        {{ $time }}
      </td>
    </tr>
  </table>

  @if (filled($notes))
    <p style="margin: 0 0 8px; color: #211d18; font-size: 14px; font-weight: 700;">
      Reservation notes
    </p>
    <div
      style="margin-bottom: 24px; border-left: 3px solid #d6a34a; background-color: #faf7f1; padding: 14px 16px; color: #625b52; font-size: 14px; line-height: 1.6;">
      {!! nl2br(e($notes)) !!}
    </div>
  @endif

  <x-mail::button :url="$reservationsUrl">
    View My Reservations
  </x-mail::button>

  Please arrive a few minutes before your reservation. You may cancel through My Reservations at least one hour before
  the scheduled start time.

  Thank you,<br>
  **Supreme Barbers**
</x-mail::message>