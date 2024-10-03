const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");
const template = fs.readFileSync(
  path.resolve(__dirname, "template-inline.html"),
  "utf8"
);
const Handlebars = require("handlebars");

require("dotenv").config();

const databaseId = process.env.NOTION_DB_ID;
const notion = new Client({ auth: process.env.NOTION_API_KEY });

if (!notion || !databaseId) {
  console.error("You must provide notion database id and notion API Key");
  process.exit(1);
}

const randomFetch = async function () {
  // wait a period of time to increase the randomizer rate.
  // 10s -> 30k ms (0.5 min)
  const randNumber = randomIntFromInterval(10 * 1000, 30 * 1000);
  delay(randNumber).then(() => {
    console.log(`Delayed ${randNumber}ms to enhance the randomizer algorithm`);
  });

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: "Rand",
        direction: "ascending",
      },
    ],
    filter: {
      property: "Result",
      select: {
        does_not_equal: "Good Understanding",
      },
    },
    page_size: 100, // max, the bigger, the more randomized
  });

  return response;
};

/**
 * Build an email content from database content's records.
 * https://developers.notion.com/reference/post-database-query
 */
const buildEmailContent = function (response) {
  if (!response || !response?.results) {
    process.exit(1);
  }

  const rows = response.results;
  console.log(rows);
  const vocabularies = rows.map(({ properties }) => {
    const vocab = {
      name: getPlainText(properties["Name"]),
      meaning: getPlainText(properties["Meaning"]),
      partOfSpeech: getPlainText(properties["Part of Speech"]),
      example: getPlainText(properties["Example"]),
      meanOfExample: getPlainText(properties["Mean of example"]),
      pronunciation: getPlainText(properties["IPA"]),
      result: getPlainText(properties["Result"]),
    };
    return vocab;
  });

  console.log(vocabularies);

  // just take max 3 randomized records
  // because notion randomizer is not good enough.
  const shuffledArray = [...vocabularies];
  shuffleArray(shuffledArray);
  const randomizedVocabs = shuffledArray.slice(0, 3);

  if (randomizedVocabs.length <= 0) {
    console.log("No vocabularies available to send.");
    process.exit(1);
  }

  console.log("Today's vocab:");
  console.log(randomizedVocabs);

  const hbTemplate = Handlebars.compile(template);
  const html = hbTemplate({ vocabularies: randomizedVocabs });

  return html;
};

const getPlainText = function (property) {
  if (property.type == "rich_text") {
    const rows = property?.rich_text?.map((r) => r.plain_text);
    return rows?.join("");
  }

  if (property.type == "title") {
    const rows = property?.title?.map((r) => r.plain_text);
    return rows?.join("");
  }

  if (property.type == "select") {
    return property?.select;
  }

  return "";
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { randomFetch, buildEmailContent };
