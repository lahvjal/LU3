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
        If this link is no longer valid, request a new sign-in link from the login page.
      </p>
    `),
  };
}

export function parentInviteEmail(parentName: string, magicLinkUrl: string) {
  return {
    subject: `Young Men Camp – Complete Registration`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">Camp Registration</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong style="color:#e8e0d4;">${parentName}</strong>,
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        You've been invited to register your young men for the
        Lehi Utah 3rd Stake Young Men Camp (June 15&ndash;19, 2026).
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Click below to create your account, add your young men's information,
        and complete registration.
      </p>
      ${button("Complete Registration", magicLinkUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        If this link is no longer valid, request a new sign-in link from the login page.
      </p>
    `),
  };
}

export function passwordResetEmail(displayName: string, resetUrl: string) {
  return {
    subject: `Reset your Camp Tracker password`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">Reset Your Password</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong style="color:#e8e0d4;">${displayName}</strong>,
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        We received a request to reset your password for the LU3 Camp Tracker.
        Click below to choose a new password. This link expires in 1 hour.
      </p>
      ${button("Reset Password", resetUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        If you didn't request this, you can safely ignore it — your password won't change.
      </p>
    `),
  };
}

export function signInLinkEmail(displayName: string, magicLinkUrl: string) {
  return {
    subject: `Your Camp Tracker sign-in link`,
    html: layout(`
      <h2 style="color:#e8e0d4;font-size:20px;margin:0 0 12px;">Sign In</h2>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong style="color:#e8e0d4;">${displayName}</strong>,
      </p>
      <p style="color:#9a8e7f;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Here's your one-click sign-in link for the LU3 Camp Tracker.
        This link expires shortly, so use it soon.
      </p>
      ${button("Sign In to Camp Tracker", magicLinkUrl)}
      <p style="color:#6b6054;font-size:11px;margin:16px 0 0;text-align:center;">
        If you didn't request this, you can safely ignore it.
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
        If this link is no longer valid, request a new sign-in link from the login page.
      </p>
    `),
  };
}
