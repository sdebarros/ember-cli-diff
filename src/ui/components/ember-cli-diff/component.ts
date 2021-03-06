import Component, { tracked } from '@glimmer/component';
import Navigo from 'navigo';
import { setItem, getItem } from '../../../utils/session-storage';

declare const $, Diff2HtmlUI;

const router = new Navigo(null, true);

export default class EmberCliDiff extends Component {
  @tracked
  from: any;
  @tracked
  to: any;
  @tracked
  downloadDiffUrl: any;
  @tracked
  hasSelection: boolean;

  json: any;

  constructor(options) {
    super(options);

    this.hasSelection = false;

    this.json = ["v2.15.0-beta.1", "v2.14.0", "v2.14.0-beta.2", "v2.14.0-beta.1", "v2.13.3", "v2.13.2", "v2.13.1", "v2.13.0", "v2.13.0-beta.4", "v2.13.0-beta.3", "v2.13.0-beta.2", "v2.13.0-beta.1", "v2.12.3", "v2.12.2", "v2.12.1", "v2.12.0", "v2.12.0-beta.2", "v2.12.0-beta.1", "v2.11.1", "v2.11.0", "v2.11.0-beta.2", "v2.11.0-beta.1", "v2.10.1", "v2.10.0", "v2.10.0-beta.2", "v2.10.0-beta.1", "v2.9.1", "v2.9.0", "v2.9.0-beta.2", "v2.9.0-beta.1", "v2.8.0", "v2.8.0-beta.3", "v2.8.0-beta.2", "v2.8.0-beta.1", "v2.7.0", "v2.7.0-beta.6", "v2.7.0-beta.5", "v2.7.0-beta.4", "v2.7.0-beta.3", "v2.7.0-beta.2", "v2.7.0-beta.1", "v2.6.3", "v2.6.2", "v2.6.1", "v2.6.0", "v2.6.0-beta.3", "v2.6.0-beta.2", "v2.6.0-beta.1", "v2.5.1", "v2.5.0", "v2.4.3", "v2.4.2", "v2.4.1", "v2.4.0", "v2.3.0", "v2.3.0-beta.2", "v2.3.0-beta.1", "v2.2.0-beta.6", "v2.2.0-beta.5", "v2.2.0-beta.4", "v2.2.0-beta.3", "v2.2.0-beta.2", "v2.2.0-beta.1", "v1.13.15", "v1.13.14", "v1.13.13", "v1.13.12", "v1.13.11", "v1.13.10", "v1.13.8", "v1.13.7", "v1.13.6", "v1.13.5", "v1.13.1", "v1.13.0", "v0.2.7", "v0.2.6", "v0.2.5", "v0.2.4", "v0.2.3", "v0.2.2", "v0.2.1", "v0.2.0", "v0.2.0-beta.1", "v0.1.15", "v0.1.14", "v0.1.13", "v0.1.12", "v0.1.11", "v0.1.10", "v0.1.9", "v0.1.8", "v0.1.7", "v0.1.6", "v0.1.5", "v0.1.4", "v0.1.3", "v0.1.2", "v0.1.1", "v0.1.0", "v0.0.47", "v0.0.46", "v0.0.45"]

    router
      .on({
        '/:from/:to': (params, query) => {
          this.from = params.from;
          this.to = params.to;
          this.hasSelection = true;
        },
      })
      .resolve();
  }

  createHashForSelect2(versions) {
    return versions.map(function(version) {
      return { id: version, text: version };
    });
  }

  didInsertElement() {
    this.loadTags().then((tags) => {
      $("select").select2({
        data: this.createHashForSelect2(tags)
      });

      $("#from").val(this.from).trigger("change");
      $("#to").val(this.to).trigger("change");

      if (this.from && this.to) {
        this.loadDiff();
      }
    });
  }

  loadTags() {
    return new Promise((resolve) => {
      var tags = getItem('tags');

      if (tags) {
        resolve(tags);
      } else {
        fetch(`https://api.github.com/repos/ember-cli/ember-new-output/tags?per_page=100`)
          .then(request => request.json())
          .then((tags) => {
            let versionTags = tags.map((tag) => {
              return tag.name;
            });

            setItem('tags', versionTags);

            resolve(versionTags);
          });
      }
    });
  }

  loadVersion(key, e) {
    this[key] = e.target.value;

    if (key === "from") {
      this.loadTags().then((tags) => {
        let greaterThanFromVersion = tags.slice(0, tags.indexOf(this.from));
        $("#to").empty().prepend('<option value="">').select2({
          data: this.createHashForSelect2(greaterThanFromVersion)
        })

        $("#to").val(this.to).trigger("change");
      });
    }
  }

  load(e) {
    if (this.from && this.to) {
      router.navigate(`/${this.from}/${this.to}`);
      this.loadDiff();
    }
  }

  loadDiff() {
    fetch(`https://api.github.com/repos/ember-cli/ember-new-output/compare/${this.from}...${this.to}`, {
      headers: new Headers({"Accept": "application/vnd.github.v3.diff"})
    })
    .then(request => request.text())
    .then((text) => {
      if (text) {
        this.downloadDiffUrl = `https://github.com/ember-cli/ember-new-output/compare/${this.from}...${this.to}.diff`;
        var diff2htmlUi = new Diff2HtmlUI({diff: text});
        diff2htmlUi.draw('#diff', {inputFormat: 'diff', showFiles: false, matching: 'lines'});
      } else {
        this.downloadDiffUrl = null;
        $("#diff").html("No changes");
      }
    });
  }
}
