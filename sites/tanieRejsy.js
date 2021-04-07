const url = "https://www.tanierejsy.pl";

const subPages = [
  "https://www.tanierejsy.pl/pl/polnoc.html",
  "https://www.tanierejsy.pl/pl/europa_zachodnia.html",
  "https://www.tanierejsy.pl/pl/wyspy_kanaryjskie.html",
  "https://www.tanierejsy.pl/pl/baltyk_zachodni.html",
  "https://www.tanierejsy.pl/pl/baltyk.html",
  "https://www.tanierejsy.pl/pl/chorwacja.html",
  "https://www.tanierejsy.pl/pl/grecja.html",
  "https://www.tanierejsy.pl/pl/morze_srodziemne.html",
  "https://www.tanierejsy.pl/pl/karaiby.html",
  "https://www.tanierejsy.pl/pl/rejsy_srodladowe.html",
  "https://www.tanierejsy.pl/pl/jeszcze_dalej.html",
];

const cheerio = require("cheerio");
const fetch = require("node-fetch");
const Website = require("../models/websites");

class tanieRejsy {
  static get() {
    return Promise.all(
      subPages.map((urls) =>
        fetch(urls)
          .then((res) => res.text())
          .then((html) => {
            return this.loadAndFind(html, urls);
          })
          .catch((err) => {
            console.log(err);
          })
      )
    );
  }

  static loadAndFind = (html, urls) => {
    const $ = cheerio.load(html);
    let found = [];
    $("table[id='rejsyNew'] > tbody > tr").each((i, el) => {
      if (i !== 0) {
        found.push({
          title: $(el).children("td").children("h2").text(),
          dateRange: $(el)
            .children("td")
            .children("div[class='info fLeft']")
            .children("div")
            .eq(0)
            .text(),
          route: $(el)
            .children("td")
            .children("div[class='info fLeft']")
            .children("div")
            .eq(1)
            .text(),
          info: $(el)
            .children("td")
            .children("div[class='info fLeft']")
            .children("div")
            .eq(2)
            .text(),
          organizer: $(el)
            .children("td")
            .children("div[class='info fLeft']")
            .children("div")
            .eq(3)
            .text(),
          price: $(el)
            .children("td")
            .children("div[class='fRight panel']")
            .children("div[class='price']")
            .text()
            .trim()
            .replace(/\s/g, ""),
          area: urls.substring(
            urls.lastIndexOf("/") + 1,
            urls.lastIndexOf(".")
          ),
          link:
            url +
            $(el).children("td").children("h2").children("a").attr("href"),
        });
      }
    });
    return found;
  };

  static saveToDb() {
    this.get().then((data) => {
      if (data && data.length !== 0) {
        Website.deleteMany({ siteUrl: url }, function (err) {
          if (err) console.log(err);
          console.log(
            new Date().toISOString() +
              " - " +
              "Successful deletion of old data" +
              " - " +
              url
          );
        }).then(() => {
          console.log(
            new Date().toISOString() +
              " - " +
              "Inserting new data" +
              " - " +
              url
          );

          data.forEach(function (el, i) {
            el.forEach((value) => {
              let website = new Website({
                title: value.title ? value.title : "no data",
                dateRange: value.dateRange
                  ? value.dateRange.substring(value.dateRange.indexOf(":") + 2)
                  : "no data",
                route: value.route
                  ? value.route.substring(value.route.indexOf(":") + 2)
                  : "no data",
                info: value.info
                  ? value.info.substring(value.info.indexOf(":") + 2)
                  : "no data",
                organizer: value.organizer
                  ? value.organizer.substring(value.organizer.indexOf(":") + 2)
                  : "no data",
                price: value.price.match(/\d+/)
                  ? value.price.match(/\d+/)[0]
                  : -1,
                currency: value.price.includes("zł") ? "pln" : "eur",
                area: value.area ? value.area : "no data",
                link: value.link ? value.link : "no data",
                siteUrl: url,
              });
              website.save(data);
            });
          });
        });
      } else {
        console.error(
          new Date().toISOString() +
            " - " +
            "Problem with the website - no data" +
            " - " +
            url
        );
      }
    });
  }
}

module.exports = tanieRejsy;
