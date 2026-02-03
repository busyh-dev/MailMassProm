-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "customFields" TEXT DEFAULT '{}',
    "totalEmailsReceived" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" DATETIME,
    "source" TEXT DEFAULT 'manual',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contact_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "contact_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "list_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "list_contacts_listId_fkey" FOREIGN KEY ("listId") REFERENCES "contact_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "list_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "category" TEXT DEFAULT 'general',
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "preheader" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "replyTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'REGULAR',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "completedAt" DATETIME,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "trackOpens" BOOLEAN NOT NULL DEFAULT true,
    "trackClicks" BOOLEAN NOT NULL DEFAULT true,
    "enableAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "isAbTest" BOOLEAN NOT NULL DEFAULT false,
    "abTestWinner" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "listId" TEXT,
    CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "campaigns_listId_fkey" FOREIGN KEY ("listId") REFERENCES "contact_lists" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 50,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    CONSTRAINT "ab_test_variants_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "status" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "openedAt" DATETIME,
    "firstOpenedAt" DATETIME,
    "clickedAt" DATETIME,
    "firstClickedAt" DATETIME,
    "unsubscribedAt" DATETIME,
    "bouncedAt" DATETIME,
    "complainedAt" DATETIME,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounceType" TEXT,
    "bounceReason" TEXT,
    "errorMessage" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "device" TEXT,
    "abVariant" TEXT,
    "customData" TEXT DEFAULT '{}',
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "email_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_logs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "linkText" TEXT,
    "position" INTEGER,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "emailLogId" TEXT NOT NULL,
    CONSTRAINT "click_events_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "email_logs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "description" TEXT,
    "data" TEXT DEFAULT '{}',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    CONSTRAINT "campaign_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "trigger" TEXT NOT NULL,
    "triggerData" TEXT DEFAULT '{}',
    "delay" INTEGER DEFAULT 0,
    "sendTime" TEXT,
    "timezone" TEXT DEFAULT 'Europe/Rome',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    CONSTRAINT "automations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "configuration" TEXT NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "automationId" TEXT NOT NULL,
    CONSTRAINT "automation_steps_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "automationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "automation_runs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_runs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "headers" TEXT DEFAULT '{}',
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" DATETIME,
    "failedAt" DATETIME,
    "nextRetryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookId" TEXT NOT NULL,
    CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "contacts_userId_status_idx" ON "contacts"("userId", "status");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_tags_idx" ON "contacts"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_userId_key" ON "contacts"("email", "userId");

-- CreateIndex
CREATE INDEX "contact_lists_userId_idx" ON "contact_lists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "list_contacts_listId_contactId_key" ON "list_contacts"("listId", "contactId");

-- CreateIndex
CREATE INDEX "templates_userId_type_idx" ON "templates"("userId", "type");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "campaigns_userId_status_idx" ON "campaigns"("userId", "status");

-- CreateIndex
CREATE INDEX "campaigns_scheduledAt_idx" ON "campaigns"("scheduledAt");

-- CreateIndex
CREATE INDEX "campaigns_sentAt_idx" ON "campaigns"("sentAt");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_messageId_key" ON "email_logs"("messageId");

-- CreateIndex
CREATE INDEX "email_logs_campaignId_idx" ON "email_logs"("campaignId");

-- CreateIndex
CREATE INDEX "email_logs_contactId_idx" ON "email_logs"("contactId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "email_logs_openedAt_idx" ON "email_logs"("openedAt");

-- CreateIndex
CREATE INDEX "click_events_emailLogId_idx" ON "click_events"("emailLogId");

-- CreateIndex
CREATE INDEX "click_events_url_idx" ON "click_events"("url");

-- CreateIndex
CREATE INDEX "campaign_events_campaignId_idx" ON "campaign_events"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_events_event_idx" ON "campaign_events"("event");

-- CreateIndex
CREATE INDEX "automations_userId_isActive_idx" ON "automations"("userId", "isActive");

-- CreateIndex
CREATE INDEX "automation_steps_automationId_stepOrder_idx" ON "automation_steps"("automationId", "stepOrder");

-- CreateIndex
CREATE INDEX "automation_runs_automationId_idx" ON "automation_runs"("automationId");

-- CreateIndex
CREATE INDEX "automation_runs_contactId_idx" ON "automation_runs"("contactId");

-- CreateIndex
CREATE INDEX "webhooks_userId_idx" ON "webhooks"("userId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_idx" ON "webhook_deliveries"("event");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
