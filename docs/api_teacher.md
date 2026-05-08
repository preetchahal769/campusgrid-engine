# CampusGrid Teacher API - Frontend Integration Guide

This guide provides full details for frontend developers to integrate the Teacher Dashboard.

---

## 🔐 Authentication & Session
All requests require the `access_token` cookie for authentication.

### 1. Login (Public)
- **Method**: `POST`
- **URL**: `/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: Returns the JWT token and basic user profile. Sets `access_token` cookie.

### 2. Logout
- **Method**: `POST`
- **URL**: `/auth/logout`

### 3. Change Password
- **Method**: `POST`
- **URL**: `/auth/change-password`
- **Body**: `{ "oldPassword": "...", "newPassword": "..." }`

### 4. Forgot Password (Public)
- **Method**: `POST`
- **URL**: `/auth/forgot-password`
- **Body**: `{ "email": "..." }`

---

## 💡 Pro-Tip for Frontend
> [!TIP]
> All **POST** (Create) requests in this API return the **Complete Created Object**. 
> This includes the `id` and any default values set by the server.

---

## 👤 Profile & Performance

### 1. View My Profile & Assignments
Retrieve your personal info, qualification, and all subjects/sections assigned to you.
- **Method**: `GET`
- **URL**: `/teachers/me`
- **Response Structure**:
```json
{
  "id": "teacher_cuid",
  "qualification": "M.Sc Mathematics",
  "specilization": "Algebra",
  "Experince": "5 Years",
  "users": {
    "name": "Jane Doe",
    "email": "jane@school.com"
  },
  "teachersubjectsection": [
    {
      "subject": { "name": "Mathematics", "code": "MATH101" },
      "section": { "name": "Section A", "grade": { "name": "Grade 10" } }
    }
  ]
}
```

### 2. Update My Personal Profile
Update your basic information like name or phone number.
- **Method**: `PATCH`
- **URL**: `/users/profile`
- **Request Body**:
```json
{
  "name": "Jane Updated Doe",
  "phoneNo": "+1234567890"
}
```

---

## 📝 Classroom Management

### 1. Create Assignment
- **Method**: `POST`
- **URL**: `/academics/assignments`
- **Request Body**:
```json
{
  "title": "Algebra Homework",
  "description": "Complete exercises 1 to 10",
  "dueDate": "2024-05-20",
  "maxMarks": 50,
  "subject_id": "cuid_of_subject",
  "section_id": "cuid_of_section"
}
```

### 2. Get Allowed Assignment Contexts
Retrieve all classes and subjects you are authorized to send assignments to.
- **Method**: `GET`
- **URL**: `/academics/assignments/allowed-contexts`
- **Response Structure**:
```json
[
  {
    "id": "tss_id",
    "subject": { "id": "sub_id", "name": "Mathematics", "code": "MATH101" },
    "section": { 
      "id": "sec_id", 
      "name": "Section A", 
      "grade": { "id": "gr_id", "name": "Grade 10" } 
    }
  }
]
```

### 3. Grade a Student Submission
Update marks for a specific student's work.
- **Method**: `POST`
- **URL**: `/academics/submissions/:id/grade`
- **Request Body**:
```json
{
  "marks": 45
}
```
- **Details**: This triggers a background task to update the student's `globalRank`.

### 4. View Own Teaching Schedule
- **Method**: `GET`
- **URL**: `/academics/timetable/teacher/:teacherId`
- **Response Structure**:
```json
[
  {
    "dayOfWeek": "Monday",
    "lectureNo": 1,
    "section": { "name": "Section A", "grade": { "name": "Grade 10" } },
    "subject": { "name": "Maths" }
  }
]
```

---

## 🏥 Student Care (Leaves)

### 5. Review Leave Requests
Teachers assigned as **Class In-charge** can see their section's leaves.
- **Method**: `GET`
- **URL**: `/academics/leaves`
- **Response Structure**:
```json
[
  {
    "id": "leave_id",
    "startDate": "2024-05-10",
    "status": "PENDING",
    "student": {
      "users": { "name": "Alice Smith" }
    }
  }
]
```

### 6. Approve or Reject Leave
- **Method**: `PATCH`
- **URL**: `/academics/leaves/:id/status`
- **Request Body**:
```json
{
  "status": "APPROVED" 
}
```
*Note: Use `REJECTED` to deny. If the leave is in `ESCALATED` status, teachers are blocked from modifying it.*

---

## 📢 Communications

### 7. Get Available Target Roles for Broadcast
Retrieve the list of roles you can send broadcasts to.
- **Method**: `GET`
- **URL**: `/broadcast/target-roles`
- **Response Structure**:
```json
[
  { "label": "Principal", "value": "PRINCIPAL" },
  { "label": "Teacher", "value": "TEACHER" },
  { "label": "Admin", "value": "ADMIN" },
  { "label": "Student", "value": "STUDENT" },
  { "label": "Parent", "value": "PARENT" }
]
```

### 8. Send Announcement (Broadcast)
- **Method**: `POST`
- **URL**: `/communications/broadcasts`
- **Request Body**:
```json
{
  "title": "Meeting Tomorrow",
  "message": "All students must gather in the hall.",
  "targetrole": "STUDENT"
}
```
