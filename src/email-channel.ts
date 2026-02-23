/**
 * Gmail Channel for NanoClaw
 * Polls Gmail for unread inbox emails and routes them to the agent.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { google } from 'googleapis';

import { logger } from './logger.js';

const GMAIL_CONFIG_DIR = path.join(os.homedir(), '.gmail-mcp');
const CREDENTIALS_PATH = path.join(GMAIL_CONFIG_DIR, 'credentials.json');
const OAUTH_KEYS_PATH = path.join(GMAIL_CONFIG_DIR, 'gcp-oauth.keys.json');

export const EMAIL_POLL_INTERVAL_MS = 60000; // Poll every minute

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

export function isGmailConfigured(): boolean {
  return fs.existsSync(CREDENTIALS_PATH) && fs.existsSync(OAUTH_KEYS_PATH);
}

function createOAuth2Client() {
  const keys = JSON.parse(fs.readFileSync(OAUTH_KEYS_PATH, 'utf-8'));
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

  const clientConfig = keys.installed || keys.web;
  const oauth2Client = new google.auth.OAuth2(
    clientConfig.client_id,
    clientConfig.client_secret,
    clientConfig.redirect_uris[0],
  );

  oauth2Client.setCredentials(credentials);

  // Auto-save refreshed tokens
  oauth2Client.on('tokens', (tokens) => {
    const current = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const updated = { ...current, ...tokens };
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(updated, null, 2));
    logger.debug('Gmail OAuth tokens refreshed');
  });

  return oauth2Client;
}

function extractBody(payload: any): string {
  if (payload?.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return '';
}

export async function fetchUnreadEmails(): Promise<EmailMessage[]> {
  const auth = createOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread in:inbox',
    maxResults: 10,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) return [];

  const emails: EmailMessage[] = [];
  for (const msg of messages) {
    if (!msg.id) continue;
    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = full.data.payload?.headers || [];
      const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(no subject)';
      const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';

      const body = extractBody(full.data.payload).slice(0, 4000);

      emails.push({
        id: msg.id,
        threadId: full.data.threadId || msg.id,
        from,
        subject,
        body,
        date,
      });
    } catch (err) {
      logger.warn({ messageId: msg.id, err }, 'Failed to fetch email details');
    }
  }

  return emails;
}

export async function markEmailAsRead(messageId: string): Promise<void> {
  const auth = createOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}
