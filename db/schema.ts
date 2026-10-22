import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const celebrations = sqliteTable("celebrations", {
  id: text("id").primaryKey(), name: text("name").notNull(), birthday: text("birthday").notNull(),
  age: integer("age"), sender: text("sender").notNull(), blessing: text("blessing").notNull(),
  theme: text("theme").notNull().default("cherry"), editTokenHash: text("edit_token_hash").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), celebrationId: text("celebration_id").notNull(),
  name: text("name").notNull(), content: text("content").notNull(), kind: text("kind").notNull(),
  color: text("color").notNull(), senderHash: text("sender_hash").notNull(), createdAt: text("created_at").notNull(),
}, (table) => [
  index("messages_board_date").on(table.celebrationId, table.createdAt),
  index("messages_sender_date").on(table.senderHash, table.createdAt),
]);
