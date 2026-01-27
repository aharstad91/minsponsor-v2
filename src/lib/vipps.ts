import { Client } from '@vippsmobilepay/sdk';

// Create Vipps client with partner credentials
export function createVippsClient() {
  return Client({
    merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
    subscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY!,
    useTestMode: process.env.VIPPS_USE_TEST_MODE === 'true',
    retryRequests: true,
  });
}

// Get access token for API calls
export async function getVippsAccessToken() {
  const client = createVippsClient();
  return await client.auth.getToken(
    process.env.VIPPS_CLIENT_ID!,
    process.env.VIPPS_CLIENT_SECRET!
  );
}

// Get the base API URL based on test mode
function getApiBaseUrl() {
  return process.env.VIPPS_USE_TEST_MODE === 'true'
    ? 'https://apitest.vipps.no'
    : 'https://api.vipps.no';
}

// Standard headers for Vipps API calls
async function getVippsHeaders(merchantMsn: string) {
  const tokenResponse = await getVippsAccessToken();
  if (!tokenResponse.ok) {
    throw new Error('Failed to get Vipps access token');
  }
  const token = tokenResponse.data;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token.access_token}`,
    'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
    'Merchant-Serial-Number': merchantMsn,
    'Vipps-System-Name': 'MinSponsor',
    'Vipps-System-Version': '1.0.0',
  };
}

export type CreateAgreementParams = {
  phoneNumber: string;
  amount: number; // In øre
  productName: string;
  merchantRedirectUrl: string;
  merchantAgreementUrl: string;
};

export type CreateAgreementResponse = {
  agreementId: string;
  vippsConfirmationUrl: string;
};

// Create recurring agreement for a specific merchant (club)
export async function createVippsAgreement(
  merchantMsn: string,
  params: CreateAgreementParams
): Promise<CreateAgreementResponse> {
  const baseUrl = getApiBaseUrl();
  const headers = await getVippsHeaders(merchantMsn);

  const response = await fetch(`${baseUrl}/recurring/v3/agreements`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phoneNumber: params.phoneNumber,
      interval: { unit: 'MONTH', count: 1 },
      pricing: {
        amount: params.amount,
        currency: 'NOK',
        type: 'LEGACY',
      },
      productName: params.productName,
      merchantRedirectUrl: params.merchantRedirectUrl,
      merchantAgreementUrl: params.merchantAgreementUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export type GetAgreementResponse = {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'STOPPED' | 'EXPIRED';
  phoneNumber: string;
  productName: string;
  pricing: {
    amount: number;
    currency: string;
  };
  interval: {
    unit: string;
    count: number;
  };
};

// Get agreement status
export async function getVippsAgreement(
  merchantMsn: string,
  agreementId: string
): Promise<GetAgreementResponse> {
  const baseUrl = getApiBaseUrl();
  const headers = await getVippsHeaders(merchantMsn);

  const response = await fetch(`${baseUrl}/recurring/v3/agreements/${agreementId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export type CreateChargeParams = {
  amount: number; // In øre
  description: string;
  dueDate: string; // YYYY-MM-DD
  retryDays?: number;
};

export type CreateChargeResponse = {
  chargeId: string;
};

// Create a charge for an existing agreement
export async function createVippsCharge(
  merchantMsn: string,
  agreementId: string,
  params: CreateChargeParams
): Promise<CreateChargeResponse> {
  const baseUrl = getApiBaseUrl();
  const headers = await getVippsHeaders(merchantMsn);

  // Generate idempotency key based on agreement and due date
  const idempotencyKey = `${agreementId}-${params.dueDate}`;

  const response = await fetch(`${baseUrl}/recurring/v3/agreements/${agreementId}/charges`, {
    method: 'POST',
    headers: {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      amount: params.amount,
      description: params.description,
      due: params.dueDate,
      transactionType: 'DIRECT_CAPTURE',
      retryDays: params.retryDays ?? 5,
      type: 'RECURRING',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps charge error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// Stop/cancel an agreement
export async function stopVippsAgreement(
  merchantMsn: string,
  agreementId: string
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const headers = await getVippsHeaders(merchantMsn);

  const response = await fetch(`${baseUrl}/recurring/v3/agreements/${agreementId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'STOPPED',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vipps stop agreement error: ${JSON.stringify(error)}`);
  }
}

// Format phone number to Norwegian format (47XXXXXXXX)
export function formatNorwegianPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If already starts with 47 and is 10 digits, return as is
  if (digits.startsWith('47') && digits.length === 10) {
    return digits;
  }

  // If 8 digits, add 47 prefix
  if (digits.length === 8) {
    return `47${digits}`;
  }

  // If starts with 0047, remove the 00
  if (digits.startsWith('0047')) {
    return digits.slice(2);
  }

  // If starts with +47, it's been converted to just digits starting with 47
  // Return as is if 10 digits
  if (digits.length === 10 && digits.startsWith('47')) {
    return digits;
  }

  // Default: add 47 prefix
  return `47${digits}`;
}
