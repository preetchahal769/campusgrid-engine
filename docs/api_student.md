# CampusGrid Student API - Frontend Integration Guide

This guide provides full details for frontend developers to integrate the Student Dashboard.

---

## 🔐 Authentication & Session
All requests require the `access_token` cookie for authentication.

### 1. Login (Public)
Authenticate the user and establish a session.
- **Method**: `POST`
- **URL**: `/auth/login`
- **Body**:
```json
{
  "email": "student@example.com",
  "password": "yourpassword"
}
```
- **Response Structure**:
```json
{
  "access_token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "student@example.com",
    "role": "STUDENT",
    "School_id": "school_id",
    "globalRating": 0,
    "globalRank": null
  }
}
```
- **Note**: The `access_token` is also automatically set as an **HTTP-only Cookie**. Frontend should just send `credentials: 'include'` with fetch/axios.

### 2. Logout
- **Method**: `POST`
- **URL**: `/auth/logout`
- **Details**: Clears the `access_token` cookie.

---

## 💡 Pro-Tip for Frontend
> [!TIP]
> All **POST** (Create) requests in this API return the **Complete Created Object**. 
> Always use the returned `id` if you need to perform immediate follow-up actions.

---

## 👤 Profile & Performance

### 1. Fetch My Profile & Global Rank
Retrieve the student's personal info along with their cross-school performance metrics.
- **Method**: `GET`
- **URL**: `/students/me`
- **Response Structure**:
```json
{
  "id": "student_cuid",
  "admissionNumber": "ADM123",
  "rollNumber": 10,
  "rankingPoints": 450,
  "status": "ACTIVE",
  "users": {
    "name": "John Doe",
    "email": "john@example.com",
    "globalRating": 85.5,
    "globalRank": 12
  },
  "section": {
    "id": "section_id",
    "name": "Section A",
    "grade": { "name": "Grade 10" }
  }
}
```

---

## 📚 Academics

### 2. Fetch My Assignments
Get a list of all active homework/tasks assigned to the student's section.
- **Method**: `GET`
- **URL**: `/academics/assignments`
- **Response Structure**:
```json
[
  {
    "id": "assignment_id",
    "title": "Math Quiz",
    "description": "Solve Chapter 5",
    "dueDate": "2024-05-15T00:00:00.000Z",
    "maxMarks": 100,
    "subject": { "name": "Mathematics", "code": "MATH101" }
  }
]
```

### 3. Submit Assignment
Upload content or a link for a specific assignment.
- **Method**: `POST`
- **URL**: `/academics/assignments/:id/submit`
- **Request Body**:
```json
{
  "content": "My answer text here...",
  "fileUrl": "https://storage.com/my-homework.pdf"
}
```
- **Response**: The created `submission` object.

---

## 📅 Schedule

### 4. View Class Timetable
Fetch the weekly schedule for a specific section.
- **Method**: `GET`
- **URL**: `/academics/timetable/section/:sectionId`
- **Response Structure**:
```json
[
  {
    "dayOfWeek": "Monday",
    "lectureNo": 1,
    "startTime": "08:00 AM",
    "endTime": "09:00 AM",
    "teachersubjectsection": {
      "subject": { "name": "Physics" },
      "teachers": { "users": { "name": "Dr. Smith" } }
    }
  }
]
```

---

## 🏥 Attendance & Leaves

### 5. Apply for Leave
- **Method**: `POST`
- **URL**: `/academics/leaves`
- **Request Body**:
```json
{
  "startDate": "2024-05-10",
  "endDate": "2024-05-12",
  "reason": "Medical reasons",
  "attachmentUrl": "https://example.com/doctor-note.jpg"
}
```

### 6. My Leave History
- **Method**: `GET`
- **URL**: `/academics/leaves`
- **Response Statuses**: `PENDING`, `APPROVED`, `REJECTED`, `ESCALATED`

### 7. My Attendance Calendar
Fetch attendance records for the current user.
- **Method**: `GET`
- **URL**: `/attendance/me`
- **Query Params**: `month=5&year=2024` (Optional)
- **Response Structure**:
```json
[
  { "date": "2024-05-01", "status": "PRESENT" },
  { "date": "2024-05-02", "status": "LEAVE" }
]
```

### 8. Escalate Rejection
If a teacher rejects a leave, the student can appeal to the Principal.
- **Method**: `POST`
- **URL**: `/academics/leaves/:id/escalate`
- **Details**: No body required. Moves status to `ESCALATED`.

---

## 📢 Communications

### 8. View Broadcasts
- **Method**: `GET`
- **URL**: `/communications/broadcasts`
- **Response**: List of announcements from School Admin/Teachers.
