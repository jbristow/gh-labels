# github labels
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fjbristow%2Fgh-labels.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fjbristow%2Fgh-labels?ref=badge_shield)


This repo is used to easily sync and manage github labels based on a yml file.

## Prerequisites

* Create a Github personal access token with a scope of `repo` (full control of private repositories)
* Have node/npm installed.

## Installation

Ensure that your node `bin` directory is in your path.

```
npm install
npm link
```

## Usage
The labels that will be created are in `labels.yml`. Any existing labels that
are setup on the repos will be removed if they do not exist in `labels.yml`.
The repos that will be processed exist in organization as defined by `org` in the script.

* Run on a single repo:
    ```bash
    gh-labels -o <repo-owner> -t <gh-token> -r <repo-name>
    ```
* Run on all repos owned by an owner: (Cannot grab private repos of a user).
    ```bash
    gh-labels -o <repo-owner> -t <gh-token>
    ```
* Run on all repos owned by all owners listed:
    ```bash
    gh-labels --owners <repo-owner-1> <repo-owner-2> -t <gh-token>
    ```
* Run the update script in dry-run mode
    ```bash
    gh-labels -o <repo-owner> -t <gh-token> -r <repo-name> --dry-run
    ```
* Run on an enterprise github
    ```bash
    gh-labels -o <repo-owner> -t <gh-token> -r <repo-name> -e "https://<company github url>"
    ```



## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fjbristow%2Fgh-labels.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fjbristow%2Fgh-labels?ref=badge_large)