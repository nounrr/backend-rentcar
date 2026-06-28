/**
 * Permission constants — correspond to the permission names stored in the database.
 * Roles named "admin" or "super-admin" bypass all checks automatically.
 *
 * Convention: resource.action
 */

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const PERM_DASHBOARD_VIEW = "dashboard.view"

// ─── Users (admin/staff) ──────────────────────────────────────────────────────
export const PERM_USERS_VIEW = "users.view"
export const PERM_USERS_CREATE = "users.create"
export const PERM_USERS_EDIT = "users.edit"
export const PERM_USERS_DELETE = "users.delete"
export const PERM_USERS_MANAGE_ROLES = "users.manage-roles"
export const PERM_USERS_MANAGE_PERMISSIONS = "users.manage-permissions"
export const PERM_USERS_DEACTIVATE = "users.deactivate"

// ─── Customers ────────────────────────────────────────────────────────────────
export const PERM_CUSTOMERS_VIEW = "customers.view"
export const PERM_CUSTOMERS_CREATE = "customers.create"
export const PERM_CUSTOMERS_EDIT = "customers.edit"

// Vehicles
export const PERM_VEHICLES_VIEW = "vehicles.view"
export const PERM_VEHICLES_CREATE = "vehicles.create"
export const PERM_VEHICLES_EDIT = "vehicles.edit"
export const PERM_VEHICLES_DELETE = "vehicles.delete"
export const PERM_VEHICLE_CATEGORIES_VIEW = "vehicle-categories.view"
export const PERM_VEHICLE_CATEGORIES_MANAGE = "vehicle-categories.manage"

// ─── Orders ───────────────────────────────────────────────────────────────────
export const PERM_ORDERS_VIEW = "orders.view"
export const PERM_ORDERS_CREATE = "orders.create"
export const PERM_ORDERS_EDIT = "orders.edit"
export const PERM_ORDERS_DELETE = "orders.delete"

// ─── Products ─────────────────────────────────────────────────────────────────
export const PERM_PRODUCTS_VIEW = "products.view"
export const PERM_PRODUCTS_CREATE = "products.create"
export const PERM_PRODUCTS_EDIT = "products.edit"
export const PERM_PRODUCTS_DELETE = "products.delete"

// ─── Catalog ──────────────────────────────────────────────────────────────────
export const PERM_BRANDS_VIEW = "brands.view"
export const PERM_BRANDS_MANAGE = "brands.manage"
export const PERM_CATEGORIES_VIEW = "categories.view"
export const PERM_CATEGORIES_MANAGE = "categories.manage"

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const PERM_SUPPLIERS_VIEW = "suppliers.view"
export const PERM_SUPPLIERS_MANAGE = "suppliers.manage"
export const PERM_SUPPLIER_ORDERS_VIEW = "supplier-orders.view"
export const PERM_SUPPLIER_ORDERS_MANAGE = "supplier-orders.manage"

// ─── Roles & Permissions management ──────────────────────────────────────────
export const PERM_ROLES_VIEW = "roles.view"
export const PERM_ROLES_MANAGE = "roles.manage"
export const PERM_PERMISSIONS_VIEW = "permissions.view"
export const PERM_PERMISSIONS_MANAGE = "permissions.manage"

// ─── Reservations ─────────────────────────────────────────────────────────────
export const PERM_RESERVATIONS_VIEW = "reservations.view"
export const PERM_RESERVATIONS_CREATE = "reservations.create"
export const PERM_RESERVATIONS_EDIT = "reservations.edit"
export const PERM_RESERVATIONS_DELETE = "reservations.delete"

// ─── Payments ─────────────────────────────────────────────────────────────────
export const PERM_PAYMENTS_VIEW = "payments.view"
export const PERM_PAYMENTS_MANAGE = "payments.manage"
export const PERM_PAYMENTS_DELETE = "payments.delete"

// ─── Group helpers (useful for hasAnyPermission checks) ──────────────────────
export const PERMS_USERS_ALL = [
  PERM_USERS_VIEW,
  PERM_USERS_CREATE,
  PERM_USERS_EDIT,
  PERM_USERS_DELETE,
  PERM_USERS_MANAGE_ROLES,
  PERM_USERS_MANAGE_PERMISSIONS,
  PERM_USERS_DEACTIVATE,
] as const

/**
 * Roles that receive superadmin-level access (bypass all permission checks).
 * Add role names exactly as stored in the database.
 */
export const BYPASS_ROLES = ["super-admin", "admin"] as const
export type BypassRole = (typeof BYPASS_ROLES)[number]
