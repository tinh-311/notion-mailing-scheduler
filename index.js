const nodemailer = require("nodemailer");
const { randomFetch, buildEmailContent } = require("./notion.js");
require("dotenv").config();

const userEmail = process.env.SENDING_EMAIL;
const password = process.env.SENDING_PASSWORD;
const destinationEmail = process.env.DESTINATION_EMAIL;

if (!userEmail || !password || !destinationEmail) {
  console.error(
    "You must provide sending email, password and the destination email"
  );
  process.exit(1);
}

// Function to format the current date and time
// Function to format the current date and time for Vietnam (UTC+7)
function formatDateTime() {
  const now = new Date();

  // Use the correct timeZone for Vietnam (Asia/Ho_Chi_Minh)
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh", // Set timezone to Vietnam
  };

  return now.toLocaleString("en-GB", options).replace(",", "");
}

const main = async function () {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: userEmail,
      pass: password,
    },
  });

  const resp = await randomFetch();
  const emailContent = buildEmailContent(resp);

  // Get the current date and time
  const dateTimeString = formatDateTime();

  let mailDetails = {
    from: userEmail,
    to: destinationEmail,
    subject: `📝 Random Vocabulary - ${dateTimeString}`,
    html: emailContent,
  };

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      console.error("Can't send email: ", err.message);
    } else {
      console.log("Email sent successfully");
    }
  });
};

main();
