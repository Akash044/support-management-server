# support-management-server

# Create Support Ticket API

## Endpoint

/support/create_ticket
## Method

POST
## Content-type

application/json
## Payload

```json
{
  "userID": "<String>",
  "date": "<DateTime>",
  "deviceID": "<String>",
  "queryText": "<String>"
}
```
## Example of payload
```json
{
  "userID": "1",
  "date":"2023-12-31T17:09:11", //"YYYY-MM-DDTHH:mm:ss"
  "deviceID": "101",
  "queryText": "something is wrong"
}
```

## Response

### Case 1: Successful Ticket Creation

Condition: Last request was more than 30 minutes ago.
Response code: 200
Response data:
   ```json
   {
     "data": {
       "_id": "<mongodb_id_for_the_document>"
     }
   }
 ```
### Case 2: Throttled Request

Condition: Last request was less than or equal to 30 minutes ago.
Response code: 409
Response data:
```json
{
  "message": "You have already placed a support ticket. Please wait at least one hour before sending another request."
}
```


## Getting Started

These instructions will help you set up and run the project on your local machine.

### Prerequisites

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Akash044/support-management-server.git
2. Navigate to the project directory:
   ```bash
   cd support-management-server
3. Install dependencies:
   ```bash
   npm install
4. Create a .env file in the project root directory with the following content:
   ```bash
   DB_PASS=<db_password>
   DB_USER=<db_username>
   DB_NAME=SUPPORT_DB
   DB_COL1=issues
   DB_COL2=last_request_time
   PORT=<port_number>
   ```
   ### Replace <db_password>, <db_username>, and <port_number> with your actual database password, username of your mongodb database, and the port where you want to run the project.

5. Run the project in development mode:
   ```bash
   npm run dev
   ```
   The application will be accessible at http://localhost:<port_number>. You need third-part api client(such as POSTMAN) to access the api.
