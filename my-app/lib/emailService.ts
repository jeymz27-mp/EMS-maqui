import emailjs from '@emailjs/browser';

// Environment variable configuration for EmailJS
const ENV_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const ENV_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const ENV_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

const STORAGE_KEY_EMAILJS = 'ems_emailjs_config_v1';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export function getEmailJSConfig(): EmailJSConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMAILJS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.serviceId && parsed.templateId && parsed.publicKey) {
          return {
            serviceId: parsed.serviceId.trim(),
            templateId: parsed.templateId.trim(),
            publicKey: parsed.publicKey.trim(),
          };
        }
      }
    } catch {
      // ignore localStorage parse error
    }
  }

  return {
    serviceId: ENV_SERVICE_ID.trim(),
    templateId: ENV_TEMPLATE_ID.trim(),
    publicKey: ENV_PUBLIC_KEY.trim(),
  };
}

export function setEmailJSConfig(serviceId: string, templateId: string, publicKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY_EMAILJS,
      JSON.stringify({
        serviceId: serviceId.trim(),
        templateId: templateId.trim(),
        publicKey: publicKey.trim(),
      })
    );
  }
}

export function isEmailJSConfigured(): boolean {
  const config = getEmailJSConfig();
  return Boolean(
    config.serviceId &&
    config.templateId &&
    config.publicKey &&
    config.serviceId.length > 3 &&
    config.templateId.length > 3 &&
    config.publicKey.length > 5
  );
}

/**
 * Generate a clean, secure default password format (e.g., "EMS-928415")
 */
export function generateDefaultPassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EMS-${randomPart}`;
}

export interface SendDefaultPasswordParams {
  toEmail: string;
  toName: string;
  employeeId: string;
  defaultPassword: string;
}

export interface SendEmailResult {
  success: boolean;
  isSimulated: boolean;
  message: string;
  defaultPassword?: string;
}

/**
 * Sends the default password to the employee's email address using EmailJS.
 * If EmailJS keys are not yet configured in .env.local, it provides a safe simulated
 * delivery mode so development and school demonstrations can proceed without failing.
 */
export async function sendDefaultPasswordEmail({
  toEmail,
  toName,
  employeeId,
  defaultPassword,
}: SendDefaultPasswordParams): Promise<SendEmailResult> {
  const config = getEmailJSConfig();

  // Template variables mapping
  const templateParams = {
    to_name: toName,
    to_email: toEmail,
    email: toEmail,
    employee_id: employeeId,
    default_password: defaultPassword,
    temporary_password: defaultPassword,
    message: `Hello ${toName},\n\nYour default password for the Employee Management System (EMS v3.0) is: ${defaultPassword}\n\nPlease use this password and your Employee ID (${employeeId}) to log in.`,
    system_url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  };

  // If EmailJS credentials are provided, send via the EmailJS browser SDK
  if (isEmailJSConfigured()) {
    try {
      const response = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        config.publicKey
      );

      if (response.status === 200 || response.text === 'OK') {
        return {
          success: true,
          isSimulated: false,
          message: `Default password successfully sent to ${toEmail} via EmailJS!`,
          defaultPassword,
        };
      } else {
        return {
          success: false,
          isSimulated: false,
          message: `EmailJS responded with status: ${response.status} (${response.text})`,
          defaultPassword,
        };
      }
    } catch (err: any) {
      console.error('EmailJS send error:', err);
      return {
        success: false,
        isSimulated: false,
        message: err?.text || err?.message || 'Failed to dispatch email via EmailJS.',
        defaultPassword,
      };
    }
  }

  // Simulated fallback when EmailJS keys are pending setup
  console.info(
    `[EMS EmailJS Simulated Dispatch]\nTo: ${toName} <${toEmail}>\nID: ${employeeId}\nDefault Password: ${defaultPassword}`
  );

  return {
    success: true,
    isSimulated: true,
    message: `Default password sent to ${toEmail}! (Simulated mode: EmailJS keys pending in .env.local)`,
    defaultPassword,
  };
}
