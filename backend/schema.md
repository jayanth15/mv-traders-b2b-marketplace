

## Roles
- SuperAdmin
- Admin
- User
- AppAdmin

## Organization Types
- Vendor
- Company
- AppOwner

---

### User
- userId
- fullName
- phoneNumber
- passwordHash
- role (see Roles)
- organizationId
- organizationType (see Organization Types)
- createdAt
- createdBy
- updatedBy
- updatedAt

---

### Invoice
- invoiceId
- orderId
- fileUrl
- createdByUserId
- createdAt
- visibleTo (SuperAdmin, Admin of company/vendor only)

---

### Document
- documentId
- orderId
- fileUrl
- documentType (invoice, purchase_order, etc.)
- uploadedByUserId
- uploadedAt
- visibleTo (SuperAdmin, Admin of company/vendor only)

---

### Order Approval
- approvalId
- orderId
- requestedByUserId
- approvedByUserId
- status (Pending, Approved, Rejected)
- requestedAt
- approvedAt

---



- Only SuperAdmin/Admin can place orders for a company. Users can request orders for approval.
- For vendors, users can accept and work on orders but cannot see invoices or product prices in orders.
- Only SuperAdmin/Admin can view invoices and prices for their organization.
- SuperAdmin can create Admins and Users for their organization (company or vendor).
- Admin can manage Users but not other Admins or SuperAdmins.

---


---

## Permissions & Visibility Rules

- Only AppOwner can create Company and Vendor organizations.
- Only SuperAdmin/Admin can place orders for a company. Users can request orders for approval.
- For vendors, users can accept and work on orders but cannot see invoices or product prices in orders.
- Only SuperAdmin/Admin can view invoices and prices for their organization.
- SuperAdmin can create Admins and Users for their organization (company or vendor).
- Admin can manage Users but not other Admins or SuperAdmins.

---

## Notes
- Add visibility flags or logic in your application layer to enforce these rules.
- Document management is for invoices and purchase orders only (no contracts).

---

### Vendor
- vendorId
- vendorName
- vendorDescription

---

### Company
- companyId
- companyName
- companyDescription

---

### Product
- productId
- productName
- productDescription
- price
- unitId
- vendorId

---

### Unit
- unitId
- unitName
- unitDescription
- vendorId

---

### Order
- orderId
- placedByUserId
- placedByOrgId
- approvedByUserId
- acceptedByUserId
- placedAt
- status (see Order Status)
- createdAt
- updatedAt

---

## Order Status
- Requested
- Approved
- WaitingToBeAccepted
- Accepted
- Rejected
- OutForDelivery
- Delivered

---

### Order Item
- orderItemId
- orderId
- itemName
- itemPrice
- itemStatus (see Item Status)
- purchaseOrder (optional)
- createdAt

---

## Item Status
- Accepted
- OutOfStock
- Rejected
- OutForDelivery
- Delivered

---

### Order Item History
- orderItemHistoryId
- orderItemId
- status (see Item Status)
- createdAt