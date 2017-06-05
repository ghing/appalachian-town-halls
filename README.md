Appalachian Town Halls
======================

Interactive about town hall meetings held by members of the U.S. House of Representatives whose districts are in Appalachia.

Assumptions
-----------

* bash (or similar) shell for running scripts in package.json
* curl
* yarn

Development
-----------

Install build dependencies:

    yarn install

Fetch data:

    yarn run fetch

Bundle JavaScript and stylesheets:

    yarn run build

Watch application JavaScript and re-bundle:

    yarn run watch

Run a local development server:

    yarn run serve

Rendering timeline to string
----------------------------

If you would like to render the timeline to a string, perhaps to bootstrap the initial page HTML, you can run a script to render the timeline HTML to a string:

   ./scripts/render_timeline.js

Deployment
----------

This is a simple static site that deploys on GitHub pages. To deploy, run:

    yarn run deploy

### Deploying on Wordpress

With a little work, you can also deploy this on Wordpress.  For simplicity, let's keep the JavaScript and JSON hosted on GitHub pages.  The container HTML, initialization JavaScript and CSS will all live in Wordpress.

#### Install the "Scripts n Styles" plugin

By default, Wordpress restricts you from adding arbitrary CSS and JavaScript.  This is a good thing, because allowing arbitrary JavaScript can lead to security issues.  The [Scripts n Styles](https://wordpress.org/plugins/scripts-n-styles/) plugin is a reasonable way to be able to add custom JavaScript and CSS to specific Wordpress posts.

#### Create a post to host the app

Create a post just like you would for any Wordpress content.

#### Add two shortcodes for the app and vendor JavaScript

In the "Scripts n Styles" panel in the post admin, click the "Shortcodes" tab and add two shortcodes.

I called these shortcodes `town-halls-js-vendor` and `town-halls-js`.  You can call them whatever you want, but the name will have to match the one used in the next step.

The bodies of the shortcodes should be as follows:

`town-halls-js-vendor`:

    <script src="https://ghing.github.io/appalachian-town-halls/js/vendor.min.js"></script>

`town-halls-js`:
    <script src="https://ghing.github.io/appalachian-town-halls/js/app.min.js"></script>

#### Add the container HTML tags and script shortcodes

In the post body editor, switch to the "Text" mode and enter the following text:

    <div id="representative-search-container" class="representative-search-container"></div>
    <div id="representative-context-container" class="representative-context-container"></div>
    <div id="townhall-timeline-container" class="timeline-container"></div>
    [hoops name="town-halls-js-vendor"]
    [hoops name="town-halls-js"]

#### Add initialization JavaScript

In the "Scripts n Styles" panel in the post admin, click the "Scripts" tab and enter the following JavaScript in the text area that will be added to the post's `<body>` tag:

    (function(TownHalls) {
        var app = new TownHalls.App({
            repSearchContainer: document.getElementById('representative-search-container'),
            repContextContainer: document.getElementById('representative-context-container'),
            timelineContainer: document.getElementById('townhall-timeline-container'),
            officialMeetingsJsonUrl: 'https://ghing.github.io/appalachian-town-halls/data/official_meetings.json',
            ahcaVotesJsonUrl: 'https://ghing.github.io/appalachian-town-halls/data/ahca-votes.json',
            // HACK: Hard-coding this because this is a static-only
            // project.  Be sure to secure it by restricting to
            // certain domains.
            googleApiKey: 'AIzaSyAgdks_bI1m67WGcWkpHiDqfKTIkpWp1LA'
        });
    })(window.TownHalls);

#### Add styles

We could load the stylesheet remotely via JavaScript, but this would cause a flash of unstyled content.  Since the app doesn't have that many styles, we'll just inline them.

In the "Scripts n Styles" panel in the post admin, click the "Styles" tab and copy and paste the contents of the `dist/styles.css` file into the text area.
