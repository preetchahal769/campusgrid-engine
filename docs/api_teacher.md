# CampusGrid Teacher API - Frontend Integration Guide

This guide provides full details for frontend developers to integrate the Teacher Dashboard.

---

## 🔐 Authentication
- **Auth**: Cookie-based JWT (`access_token`)

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

### 2. Grade a Student Submission
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

### 3. View Own Teaching Schedule
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

### 4. Review Leave Requests
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

### 5. Approve or Reject Leave
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

### 6. Send Announcement (Broadcast)
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
