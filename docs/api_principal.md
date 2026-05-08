# CampusGrid Principal & Admin API - Frontend Integration Guide

This guide provides full details for building the high-level School Management Dashboard.

## 🔐 Authentication & Session
All requests require the `access_token` cookie for authentication.

### 0. Login (Public)
- **Method**: `POST`
- **URL**: `/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: Returns the JWT token and user details. Sets `access_token` cookie.

---

## 💡 Pro-Tip for Frontend
> [!TIP]
> All **POST** (Create) requests in this API return the **Complete Created Object**. 
> Always use the returned `id` if you need to perform immediate follow-up actions.

---

## 🏗️ School Setup (Academic Structure)

### 1. Create Grade (Class Level)
- **Method**: `POST`
- **URL**: `/academics/grades`
- **Request Body**:
```json
{
  "name": "Class 10",
  "School_id": "school_cuid"
}
```

### 2. Create Section
- **Method**: `POST`
- **URL**: `/academics/sections`
- **Request Body**:
```json
{
  "name": "Section B",
  "grade_id": "grade_cuid"
}
```

### 3. Create Subject
- **Method**: `POST`
- **URL**: `/academics/subjects`
- **Request Body**:
```json
{
  "name": "Chemistry",
  "type": "Theory",
  "code": "CHEM01",
  "School_id": "school_cuid"
}
```

---

## 👨‍💼 Personnel & Staffing

### 4. Register New User
- **Method**: `POST`
- **URL**: `/users/register`
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@school.com",
  "password": "securepassword",
  "role": "TEACHER" 
}
```
*Valid roles: SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER, STUDENT, STAFF.*

### 5. Assign Teacher to Subject/Section
- **Method**: `POST`
- **URL**: `/teachers/assign`
- **Request Body**:
```json
{
  "teachers_id": "teacher_profile_id",
  "subject_id": "subject_id",
  "section_id": "section_id"
}
```

### 6. Assign Class In-charge
Define which teacher manages a section (for leaves/attendance).
- **Method**: `PATCH`
- **URL**: `/academics/sections/:id/incharge`
- **Request Body**:
```json
{
  "teacherId": "teacher_profile_id"
}
```

---

## 🗓️ Scheduling

### Create Timetable (Single or Bulk)
Assign a teacher to a specific day and time. You can pass one or many slots in a single call.
*   **Method**: `POST`
*   **URL**: `/academics/timetable`
*   **Body**:
```json
{
  "slots": [
    { "dayOfWeek": "Monday", "lectureNo": 1, "startTime": "08:00 AM", "endTime": "09:00 AM", "teachersubjectsection_id": "TSS_ID" },
    { "dayOfWeek": "Tuesday", "lectureNo": 1, "startTime": "08:00 AM", "endTime": "09:00 AM", "teachersubjectsection_id": "TSS_ID" }
  ]
}
```
*Note: If any slot in the array has a conflict, the entire request will fail.*

---

## ⚖️ Oversight & Appeals

### 8. View All School Leaves
- **Method**: `GET`
- **URL**: `/academics/leaves`
- **Details**: Returns every leave request in the school, including those marked as `ESCALATED`.

### 9. Resolve Appeals
Override a teacher's rejection or approve an escalated leave.
- **Method**: `PATCH`
- **URL**: `/academics/leaves/:id/status`
- **Request Body**:
```json
{
  "status": "APPROVED"
}
```
- **Details**: This is the only way to approve a request that has the `ESCALATED` status.
