# Activity Logging System - Quick Test Guide

## 🚀 How to Test the Activity Logging System

### Prerequisites
- ✅ Backend running on http://localhost:5055
- ✅ Frontend running on http://localhost:5175
- ✅ Logged in as admin user

---

## Test 1: View Activity Logs Page

**What to do:**
1. Go to http://localhost:5175/admin/activity-logs
2. You should see a table with admin activities

**What to look for:**
- ✅ Table with columns: Time, Admin Email, Action, Description, IP Address
- ✅ Admin emails visible (not just numbers)
- ✅ Admin names displayed
- ✅ Pagination controls at bottom
- ✅ Color-coded action badges
- ✅ Total activity count

**Expected result:**
```
Time                | Admin Email              | Action              | Description
Nov 25, 3:14 PM    | john@company.com         | LOGIN               | 
                   | John Doe                 | (Green badge)       |
─────────────────────────────────────────────────────────────────────────────
Nov 25, 3:13 PM    | john@company.com         | SETTINGS_UPDATED    | Updated site settings
                   | John Doe                 | (Purple badge)      |
```

---

## Test 2: Create a Post and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/posts
2. Click "New Post" or "Create Post" button
3. Fill in:
   - Title: "Test Post for Activity Logging"
   - Content: "This is a test"
   - Slug: "test-post-logging"
   - Status: Published
4. Click "Save" or "Create" button
5. Wait for success message
6. Go to Activity Logs page

**What to look for:**
- ✅ New entry at top of table
- ✅ Action shows "POST_CREATED"
- ✅ Cyan/blue colored badge
- ✅ Description: "Created post: Test Post for Activity Logging"
- ✅ Your email showing
- ✅ Your name showing
- ✅ IP address captured

**Expected log entry:**
```
Time:          Nov 25, 3:16 PM
Admin Email:   john@company.com
Admin Name:    John Doe
Action:        POST_CREATED (Cyan badge)
Description:   Created post: Test Post for Activity Logging
IP Address:    192.168.1.102
```

✅ **Status:** PASSED if you see this

---

## Test 3: Update a Post and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/posts
2. Find the "Test Post for Activity Logging" post
3. Click Edit/Pencil icon
4. Change title to "Test Post for Activity Logging - Updated"
5. Click "Save" or "Update" button
6. Go to Activity Logs page

**What to look for:**
- ✅ New entry at top showing "POST_UPDATED"
- ✅ Yellow/orange badge (UPDATE color)
- ✅ Description shows the new title
- ✅ Your email and name

**Expected log entry:**
```
Time:          Nov 25, 3:17 PM
Admin Email:   john@company.com
Action:        POST_UPDATED (Yellow badge)
Description:   Updated post: Test Post for Activity Logging - Updated
```

✅ **Status:** PASSED if you see this

---

## Test 4: Delete a Post and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/posts
2. Find the "Test Post for Activity Logging - Updated" post
3. Click Delete/Trash icon
4. Confirm deletion
5. Go to Activity Logs page

**What to look for:**
- ✅ New entry showing "POST_DELETED"
- ✅ Red badge (DELETE color)
- ✅ Description shows post ID
- ✅ Your email and name

**Expected log entry:**
```
Time:          Nov 25, 3:18 PM
Admin Email:   john@company.com
Action:        POST_DELETED (Red badge)
Description:   Deleted post ID: 42
```

✅ **Status:** PASSED if you see this

---

## Test 5: Create a Project and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/projects
2. Click "New Project"
3. Fill in:
   - Title: "Test Project"
   - Description: "Testing project logging"
   - Other fields as needed
4. Click "Save"
5. Go to Activity Logs page

**What to look for:**
- ✅ Entry shows "PROJECT_CREATED"
- ✅ Cyan badge
- ✅ Description: "Created project: Test Project"

---

## Test 6: Create an Opportunity and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/opportunities
2. Click "New Opportunity"
3. Fill in details
4. Click "Save"
5. Go to Activity Logs page

**What to look for:**
- ✅ Entry shows "OPPORTUNITY_CREATED"
- ✅ Cyan badge
- ✅ Description with opportunity title

---

## Test 7: Update Settings and Verify Logging

**What to do:**
1. Go to http://localhost:5175/admin/settings
2. Change something (e.g., tagline or company name)
3. Click "Save settings"
4. Go to Activity Logs page

**What to look for:**
- ✅ Entry shows "SETTINGS_UPDATED"
- ✅ Purple badge
- ✅ Description: "Updated site settings"

---

## Test 8: Pagination Test

**What to do:**
1. Go to Activity Logs page
2. If you have more than 50 activities, you'll see pagination buttons
3. Click "Next →" button
4. Verify page 2 loads

**What to look for:**
- ✅ Page indicator shows "Page 2 of X"
- ✅ New batch of logs displayed
- ✅ Previous button is now enabled
- ✅ Times are older

---

## Test 9: Multiple Admin Test (if applicable)

**What to do:**
1. Create a second admin account (or use existing)
2. Login as second admin
3. Create a post
4. Logout and login as first admin
5. Go to Activity Logs

**What to look for:**
- ✅ Both admin emails visible in logs
- ✅ Each admin's name shown correctly
- ✅ Can identify which admin did what

**Example:**
```
Time           | Admin Email              | Action
Nov 25, 3:20   | sarah@company.com        | POST_CREATED
               | Sarah Smith              |
─────────────────────────────────────────────────────
Nov 25, 3:19   | john@company.com         | POST_UPDATED
               | John Doe                 |
```

---

## Test 10: Filter & Search (Browser Level)

**What to do:**
1. Open Activity Logs page
2. Use Ctrl+F (Cmd+F on Mac) to open browser find
3. Search for your email address
4. Verify all matching entries are highlighted

**What to look for:**
- ✅ All your activities are highlighted
- ✅ Easy to find your actions

---

## Color Badge Guide - Verification

Go to Activity Logs and verify these colors:

| Color | Expected Actions |
|-------|------------------|
| 🟢 Green | LOGIN, LOGOUT |
| 🔵 Blue | AVATAR_UPLOADED |
| 🔴 Red | PASSWORD_CHANGED, All DELETE actions |
| 🟣 Purple | PROFILE_UPDATED, SETTINGS_UPDATED |
| 🔷 Cyan | All CREATE actions (POST, PROJECT, OPPORTUNITY) |
| 🟨 Yellow | All UPDATE actions (POST, PROJECT, OPPORTUNITY) |
| 🟫 Deep Purple | POLICY_UPDATED |

---

## Troubleshooting

### No logs appearing
**Possible cause:** Not authenticated
**Solution:** Make sure you're logged in. Check browser console for errors.

### Emails showing as "null" or blank
**Possible cause:** Admin record doesn't have email
**Solution:** Update admin profile with email address

### IP Address showing as "Unknown"
**Possible cause:** Backend not capturing correctly
**Solution:** This is okay - backend attempts to capture req.ip

### Table not loading
**Possible cause:** Backend error
**Solution:** Check browser console (F12) for API errors

### Pagination buttons disabled
**Possible cause:** Less than 50 activities
**Solution:** Create more activities to test pagination

---

## Expected Results Summary

| Test | Action | Expected Log Entry | Status |
|------|--------|-------------------|--------|
| 1 | View page | Activity Logs load | ✅ |
| 2 | Create post | POST_CREATED appears | ✅ |
| 3 | Update post | POST_UPDATED appears | ✅ |
| 4 | Delete post | POST_DELETED appears | ✅ |
| 5 | Create project | PROJECT_CREATED appears | ✅ |
| 6 | Create opportunity | OPPORTUNITY_CREATED appears | ✅ |
| 7 | Update settings | SETTINGS_UPDATED appears | ✅ |
| 8 | Pagination | Next/Previous work | ✅ |
| 9 | Multi-admin | Different emails shown | ✅ |
| 10 | Search | Browser find highlights | ✅ |

---

## Full Test Checklist

```
[ ] Activity Logs page loads
[ ] Admin email visible
[ ] Admin name visible
[ ] POST_CREATED log appears
[ ] POST_UPDATED log appears
[ ] POST_DELETED log appears
[ ] PROJECT_CREATED log appears
[ ] OPPORTUNITY_CREATED log appears
[ ] SETTINGS_UPDATED log appears
[ ] Green badge for LOGIN
[ ] Cyan badge for CREATE actions
[ ] Yellow badge for UPDATE actions
[ ] Red badge for DELETE actions
[ ] Purple badge for SETTINGS
[ ] Pagination works
[ ] All 50 items per page displayed
[ ] Total count accurate
[ ] Timestamps formatted correctly
[ ] IP addresses captured
[ ] Multiple admins tracked correctly
```

---

## Production Deployment Checklist

Before deploying to production:

```
[ ] All tests passing
[ ] No console errors
[ ] API endpoints responding
[ ] Database logs table exists
[ ] Admin emails populated
[ ] Backups taken
[ ] Monitoring configured
[ ] Alert rules set up
[ ] Documentation updated
[ ] Stakeholders informed
[ ] Rollback plan ready
```

---

**Remember:** Activity logging is now automatic! Every action is tracked, so your audit trail is comprehensive and always up-to-date.

**Last Updated:** November 25, 2024
**Version:** 1.0.0
