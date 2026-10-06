# Assignment 39 - Validation and Centralized Error Handling (Node.js)

Student: P. Ramya Sai | Roll No: 24WU0101090 | Subject: Full Stack Lab (Internal 2)

A small College Canteen API that validates every request (body, query, params) with **Zod**,
throws **custom error classes**, and answers every error through **one Express error middleware**
that returns consistent JSON and never leaks stack traces.

## Run

```bash
npm install
npm test                 # 22 test cases for invalid input and error handling
npm run before-after     # compares a naive API with this API on 6 bad requests
npm run start:demo       # starts server on http://localhost:3000 (demo crash route enabled)
```

## Try with curl (server running)

```bash
curl -i -X POST localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"A","email":"x","rollNumber":"bad","password":"1"}'
curl -i "localhost:3000/api/menu?category=Pizza&page=0&limit=500"
curl -i localhost:3000/api/menu/abc
curl -i localhost:3000/api/demo/crash
```

## Structure

```
src/errors/AppError.js            custom error classes
src/middleware/validate.js        Zod validation for params, query, body
src/middleware/errorHandler.js    the single error middleware
src/middleware/notFound.js        unknown routes -> NotFoundError
src/schemas/*.js                  Zod schemas
src/routes/index.js               endpoints
test/api.test.js                  22 test cases (node:test)
examples/naive-app.js             "before" version used for comparison
```
