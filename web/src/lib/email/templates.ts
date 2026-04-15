const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lu3camp.com";

function layout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1a1612;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e8e0d4;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;">⛺</span>
      <h1 style="font-size:22px;font-weight:700;color:#e8e0d4;margin:8px 0 0;">LU3 Young Men Camp</h1>
      <p style="color:#9a8e7f;font-size:13px;margin:4px 0 0;">Lehi Utah 3rd Stake &mdash; June 15&ndash;19, 2026</p>
    </div>
    <div style="background:#231f1a;border:1px solid #3a332b;border-radius:10px;padding:28px 24px;">
      ${content}
    </div>
    <p style="text-align:center;color:#6b6054;font-size:11px;margin-top:24px;">
      This email was sent by the LU3 Camp Tracker. If you received this in error, you can safely ignore it.
    </p>
  </div>
</body>
</html>`.trim();
}

function button(label: string, href: string) {
  return `
<div style="text-align:center;margin:24px 0 8px;">
  <a href="${href}" style="display:inline-block;padding:12px 28px;background:#d4915e;color:#1a1612;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;">${label}</a>
</div>`.trim();
}

export function youthInviteEmail(camperName: string, magicLinkUrl: string) {
  return {
    subject: `You're invited to Young Men Camp!`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">You're Invited!</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Hi <strong style="color:#e8e0d4;">${camperName}</strong>,
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        You've been invited to join the Lehi Utah 3rd Stake Young Men Camp (June 15&ndash;19, 2026).
        Click below to set up your profile and get ready for an awesome week!
      </p>
      ${button("Join Camp Tracker", magicLinkUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        This link expires in 24 hours. After setup you'll sign in with your email and password.
      </p>
    `),
  };
}

export function parentInviteEmail(camperName: string, magicLinkUrl: string) {
  return {
    subject: `Camp invite for ${camperName} – parent action needed`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">Your Son is Invited to Camp!</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        <strong style="color:#e8e0d4;">${camperName}</strong> has been invited to attend the
        Lehi Utah 3rd Stake Young Men Camp (June 15&ndash;19, 2026).
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Click below to review camp details, complete registration, and provide any
        medical or emergency information.
      </p>
      ${button("Get Started", magicLinkUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        This link expires in 24 hours. After setup you'll sign in with your email and password.
      </p>
    `),
  };
}

export function leaderInviteEmail(recipientName: string | null, role: string, calling: string, magicLinkUrl: string) {
  const greeting = recipientName
    ? `Hi <strong style="color:#e8e0d4;">${recipientName}</strong>,`
    : "Hello,";

  return {
    subject: `You've been invited as a camp leader`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">Leadership Invitation</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${greeting}
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        You've been invited to serve as <strong style="color:#d4915e;">${calling}</strong>
        for the Lehi Utah 3rd Stake Young Men Camp (June 15&ndash;19, 2026).
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Click below to access the camp dashboard and get set up.
      </p>
      ${button("Join Camp Tracker", magicLinkUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        This link expires in 24 hours. After setup you'll sign in with your email and password.
      </p>
    `),
  };
}
