import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull(), passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"), firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(), birthday: text("birthday"), phone: text("phone"), status: text("status").notNull().default("active"), ...timestamps,
}, t => [uniqueIndex("idx_users_email").on(t.email)]);

export const courseTemplates = sqliteTable("course_templates", {
  id: text("id").primaryKey(), title: text("title").notNull(), description: text("description").notNull(),
  sessionCount: integer("session_count").notNull(), durationMinutes: integer("duration_minutes").notNull(), type: text("type").notNull(), ...timestamps,
});
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(), templateId: text("template_id").notNull(), title: text("title").notNull(), location: text("location"),
  navigationUrl: text("navigation_url"), startsAt: integer("starts_at", {mode:"timestamp"}), endsAt: integer("ends_at", {mode:"timestamp"}), status:text("status").notNull(), treeVariant:text("tree_variant").notNull(), ...timestamps,
});
export const courseSessions = sqliteTable("course_sessions", {
  id:text("id").primaryKey(), courseId:text("course_id").notNull(), sequence:integer("sequence").notNull(), title:text("title").notNull(),
  startsAt:integer("starts_at",{mode:"timestamp"}).notNull(), endsAt:integer("ends_at",{mode:"timestamp"}).notNull(), location:text("location"), navigationUrl:text("navigation_url"), ...timestamps,
}, t=>[uniqueIndex("idx_sessions_course_sequence").on(t.courseId,t.sequence)]);
export const enrollments = sqliteTable("enrollments", {
  id:text("id").primaryKey(), userId:text("user_id").notNull(), courseId:text("course_id").notNull(), accessMode:text("access_mode").notNull(), completedAt:integer("completed_at",{mode:"timestamp"}), treeVariant:text("tree_variant").notNull(), ...timestamps,
}, t=>[uniqueIndex("idx_enrollment_user_course").on(t.userId,t.courseId)]);
export const accessCodes = sqliteTable("access_codes", {
  id:text("id").primaryKey(), codeHash:text("code_hash").notNull(), courseId:text("course_id").notNull(), type:text("type").notNull(), assignedEmail:text("assigned_email"), redeemedBy:text("redeemed_by"), redeemedAt:integer("redeemed_at",{mode:"timestamp"}), ...timestamps,
}, t=>[uniqueIndex("idx_access_codes_hash").on(t.codeHash)]);
export const attendance = sqliteTable("attendance", {
  id:text("id").primaryKey(), userId:text("user_id").notNull(), sessionId:text("session_id").notNull(), recordedBy:text("recorded_by").notNull(), source:text("source").notNull(), recordedAt:integer("recorded_at",{mode:"timestamp"}).notNull(), correctionReason:text("correction_reason"), ...timestamps,
}, t=>[uniqueIndex("idx_attendance_user_session").on(t.userId,t.sessionId)]);
export const contentItems = sqliteTable("content_items", {
  id:text("id").primaryKey(), courseTemplateId:text("course_template_id"), title:text("title").notNull(), kind:text("kind").notNull(), body:text("body"), assetKey:text("asset_key"), externalUrl:text("external_url"), status:text("status").notNull(), contentUpdatedAt:integer("content_updated_at",{mode:"timestamp"}).notNull(), ...timestamps,
});
export const unlockRules = sqliteTable("unlock_rules", {
  id:text("id").primaryKey(), contentId:text("content_id").notNull(), ruleType:text("rule_type").notNull(), threshold:integer("threshold"), sessionSequence:integer("session_sequence"), ...timestamps,
});
export const manualUnlocks = sqliteTable("manual_unlocks", {
  id:text("id").primaryKey(), userId:text("user_id").notNull(), contentId:text("content_id").notNull(), grantedBy:text("granted_by").notNull(), reason:text("reason"), ...timestamps,
});
export const legalDocuments = sqliteTable("legal_documents", {
  id:text("id").primaryKey(), type:text("type").notNull(), version:text("version").notNull(), title:text("title").notNull(), body:text("body").notNull(), validFrom:integer("valid_from",{mode:"timestamp"}).notNull(), requiresConsent:integer("requires_consent",{mode:"boolean"}).notNull(), ...timestamps,
}, t=>[uniqueIndex("idx_legal_type_version").on(t.type,t.version)]);
export const consents = sqliteTable("consents", {
  id:text("id").primaryKey(), userId:text("user_id").notNull(), documentId:text("document_id").notNull(), grantedAt:integer("granted_at",{mode:"timestamp"}).notNull(), revokedAt:integer("revoked_at",{mode:"timestamp"}), ...timestamps,
});
export const auditLog = sqliteTable("audit_log", {
  id:text("id").primaryKey(), actorId:text("actor_id"), action:text("action").notNull(), entityType:text("entity_type").notNull(), entityId:text("entity_id"), detail:text("detail").notNull(), ipHash:text("ip_hash"), createdAt:integer("created_at",{mode:"timestamp"}).notNull(),
});
