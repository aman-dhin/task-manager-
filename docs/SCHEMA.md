# Database Schema — MongoDB (Mongoose)

The application uses **MongoDB** with **Mongoose** as the ODM. There are two collections: `users` and `tasks`.

## `users` collection

| Field         | Type      | Constraints                                   |
|---------------|-----------|------------------------------------------------|
| `_id`         | ObjectId  | Primary key (auto-generated)                   |
| `name`        | String    | Required                                        |
| `email`       | String    | Required, **unique**, lowercased, trimmed       |
| `passwordHash`| String    | Required — bcrypt hash, never returned in JSON  |
| `createdAt`   | Date      | Auto-managed by Mongoose `timestamps`           |
| `updatedAt`   | Date      | Auto-managed by Mongoose `timestamps`           |

A unique index on `email` enforces the "unique email" validation rule at the database level, in addition to the application-level check performed in `POST /register`.

## `tasks` collection

| Field         | Type      | Constraints                                              |
|---------------|-----------|------------------------------------------------------------|
| `_id`         | ObjectId  | Primary key (auto-generated)                              |
| `user`        | ObjectId  | Required, references `users._id` (foreign key), indexed   |
| `title`       | String    | Required, trimmed                                          |
| `description` | String    | Optional, default `''`                                     |
| `dueDate`     | Date      | Optional, default `null`                                   |
| `priority`    | String    | Enum: `High` \| `Medium` \| `Low`, default `Medium`         |
| `status`      | String    | Enum: `Pending` \| `Completed`, default `Pending`           |
| `createdAt`   | Date      | Auto-managed by Mongoose `timestamps`                       |
| `updatedAt`   | Date      | Auto-managed by Mongoose `timestamps`                       |

Indexes:
- `{ user: 1 }` — speeds up per-user task listing
- Text index on `{ title, description }` — available for future full-text search (the current search endpoint uses a case-insensitive regex match on `title`/`description`, which requires no special index configuration)

## Relationship

```
users (1) ──────< (many) tasks
   _id            user (foreign key)
```

Each task belongs to exactly one user. Deleting a user does not cascade automatically in the current implementation (Mongoose reference, not a native Mongo constraint) — this is a reasonable extension point (`user.pre('remove')` hook or an application-level cleanup) if account deletion is added later.

## Entity relationship diagram (text form)

```
┌────────────────────┐          ┌──────────────────────────┐
│        User         │          │           Task            │
├────────────────────┤          ├──────────────────────────┤
│ _id (PK)             │◄────────│ user (FK → User._id)      │
│ name                 │  1    * │ _id (PK)                  │
│ email (unique)        │        │ title                     │
│ passwordHash          │        │ description               │
│ createdAt             │        │ dueDate                   │
│ updatedAt             │        │ priority (enum)            │
└────────────────────┘          │ status (enum)              │
                                  │ createdAt                 │
                                  │ updatedAt                 │
                                  └──────────────────────────┘
```
