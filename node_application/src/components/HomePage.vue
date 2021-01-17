<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
    <b-container fluid>
        <b-row>
            <b-col cols="12" class="mt-4">
                <b-navbar toggleable="lg" type="dark" variant="dark">
                    <b-navbar-brand href="#">
                        <img src="https://rajlab.org/icons/github_white.png"
                             style="width:42px; height:40px;" class="d-inline-block align-top" alt="Kitten">
                        <span style="padding-left: 10px !important;">GitHub Issue Analyzer</span>
                    </b-navbar-brand>

                    <b-navbar-nav class="ml-auto">
                        <b-button variant="outline-warning" v-on:click="executeMonthlyTask">Monthly Summary</b-button>
                        <b-button variant="outline-warning" class="ml-2" v-on:click="executeDailyTask">Daily Notification</b-button>
                    </b-navbar-nav>
                </b-navbar>
            </b-col>
        </b-row>
        <b-card-group deck>
            <b-card header="Advance Filters">
                <b-row class="justify-content-md-center">
                    <b-col cols="3">
                        <label align="left" for="reponame">Repository Name:</label>
                        <b-form-input id="reponame" v-on:change="getIssues" v-model="reponame" type="search"
                                      placeholder="Enter name"></b-form-input>
                    </b-col>
                    <b-col cols="2">
                        <label align="left" for="issueState">Issue Status:</label>
                        <b-form-select id="issueState" v-model="selectedState" v-on:change="getIssues" :options="states"></b-form-select>
                    </b-col>
                    <b-col cols="2">
                        <label for="start-datepicker">Start Date:</label>
                        <b-form-datepicker id="start-datepicker" v-model="startdate" @input="getIssues" :max="enddate"
                                           class="mb-2"></b-form-datepicker>
                    </b-col>
                    <b-col cols="2">
                        <label for="end-datepicker">End Date:</label>
                        <b-form-datepicker id="end-datepicker" v-model="enddate" @input="getIssues" :min="startdate"
                                           class="mb-2"></b-form-datepicker>
                    </b-col>
                </b-row>
            </b-card>
        </b-card-group>
        <b-row>
            <b-col>
                <h2 class="header-style"><b>{{selectedState}}</b> GitHub issues for the <b>wso2/{{newRepoName}}</b>
                    repository from <b>{{startdate}}</b> to <b>{{enddate}}</b></h2>
            </b-col>
        </b-row>
        <b-row>
            <b-col cols="12" class="mt-4">
                <b-table stiped hover :items="issue_rows" :current-page="currentPage" :per-page="perPage">
                    <template v-slot:cell(url)="{ item, value }">
                        <b-link :href="value" target='_blank'>{{item.url}}</b-link>
                    </template>
                </b-table>
            </b-col>
        </b-row>
        <b-row>
            <b-col cols="2" class="mt-4">
                <div>
                    <h5  align="left">Total issue count: <b-badge variant="success">{{issueCount}}</b-badge></h5>
                </div>
            </b-col>
            <b-col  cols="5" class="mt-4">
                <b-alert
                        align="center"
                        :show="dismissSuccessCountDown"
                        dismissible
                        fade
                        variant="warning"
                        @dismiss-count-down="countDownSuccessChanged"
                >
                    Scheduled task manually executed!. Wait {{ dismissSuccessCountDown }} seconds... due to API rate limit in GitHub API
                </b-alert>
                <b-alert
                        align="center"
                        :show="dismissFailedCountDown"
                        dismissible
                        fade
                        variant="danger"
                        @dismiss-count-down="countDownFailedChanged"
                >
                    403 Authentication Failed. Close in {{ dismissFailedCountDown }} seconds...
                </b-alert>
            </b-col>
            <b-col  cols="5" class="mt-4">
                <b-pagination align="right" v-model="currentPage" :total-rows="issues" :per-page="perPage"
                              first-text="First"
                              prev-text="Prev"
                              next-text="Next"
                              last-text="Last"></b-pagination>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    export default {
        name: 'HomePage',
        data() {
            return {
                perPage: 7,
                currentPage: 1,
                issue_rows: [],
                reponame: "product-apim",
                newRepoName: "product-apim",
                startdate: '2021-01-01',
                enddate: '2021-01-31',
                states: ['open', 'closed'],
                selectedState: 'open',
                awaitingSearch: false,
                issueCount: 0,
                currentToken: "",
                dismissSecs: 5,
                dismissTaskSecs: 60,
                dismissFailedCountDown: 0,
                dismissSuccessCountDown: 0
            }
        },
        computed: {
            issues() {
                return this.issue_rows.length
            }
        },
        mounted() {
            this.getIssues()
        },
        watch: {
            reponame: function () {
                if (!this.awaitingSearch) {
                    setTimeout(() => {
                       this.getIssues()
                    }, 5000);
                }
            }
        },
        methods: {
            countDownSuccessChanged(dismissSuccessCountDown) {
                this.dismissSuccessCountDown = dismissSuccessCountDown
            },
            showSuccessAlert() {
                this.dismissSuccessCountDown = this.dismissTaskSecs
            },
            countDownFailedChanged(dismissFailedCountDown) {
                this.dismissFailedCountDown = dismissFailedCountDown
            },
            showFailedAlert() {
                this.dismissFailedCountDown = this.dismissSecs
            },
            getIssues: function () {
                const baseServerURI = "https://localhost:8243/token";
                const data = new URLSearchParams();
                data.append("grant_type", "client_credentials");
                this.$http.post(baseServerURI, data, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": "Basic U3Z1NThQQ0FqaTRuSVRRakxVOVRxbTJsNEFnYTpKRmtQZDRYUFNmaThlZjlXdzJtZDFGRVpGUXNh"
                    }
                }).then(response => {
                    this.currentToken = response.data.access_token;
                    this.newRepoName = this.reponame;
                    const baseURI = 'https://localhost:8243/github-analyse-services/v1/github-service/get-issues/'
                        + this.reponame + '/' + this.startdate + '/' + this.enddate + '/' + this.selectedState;
                    this.$http.get(baseURI, {
                        headers: {
                            "Authorization": "Bearer " + this.currentToken
                        }
                    }).then(response => {
                        var issues = [];
                        response.data.items.forEach(function (obj) {
                            issues.push({
                                url: obj.html_url,
                                title: obj.title,
                                created_by: obj.user.login,
                                created_date: obj.created_at
                            });
                        });

                        if (response.data.items.length === 0) {
                            issues.push({
                                url: "-",
                                title: "-",
                                created_by: "-",
                                created_date: "-"
                            });
                        }
                        this.issueCount = response.data.total_count;
                        this.issue_rows = issues;

                    }).catch(() => {
                        var issues = [];
                        issues.push({
                            url: "-",
                            title: "-",
                            created_by: "-",
                            created_date: "-"
                        });

                        this.issue_rows = issues;
                        this.issueCount = 0
                    });
                }).catch(() => {
                    this.showFailedAlert();
                });
            },
            executeMonthlyTask: function () {
                const baseServerURI = "https://localhost:8243/token";
                const data = new URLSearchParams();
                data.append("grant_type", "client_credentials");
                this.$http.post(baseServerURI, data, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": "Basic U3Z1NThQQ0FqaTRuSVRRakxVOVRxbTJsNEFnYTpKRmtQZDRYUFNmaThlZjlXdzJtZDFGRVpGUXNh"
                    }
                }).then(response => {
                    this.currentToken = response.data.access_token;
                    const baseURI = 'https://localhost:8243/github-analyse-services/v1/services/MonthlyJobProxyExecutor';
                    this.$http.post(baseURI, '', {
                        headers: {
                            "Authorization": "Bearer " + this.currentToken
                        }
                    }).then(() => {
                        this.showSuccessAlert();
                    }).catch(() => {
                        this.showFailedAlert();
                    });
                }).catch(() => {
                    this.showFailedAlert();
                });
            },
            executeDailyTask: function () {
                const baseServerURI = "https://localhost:8243/token";
                const data = new URLSearchParams();
                data.append("grant_type", "client_credentials");
                this.$http.post(baseServerURI, data, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": "Basic U3Z1NThQQ0FqaTRuSVRRakxVOVRxbTJsNEFnYTpKRmtQZDRYUFNmaThlZjlXdzJtZDFGRVpGUXNh"
                    }
                }).then(response => {
                    this.currentToken = response.data.access_token;
                    const baseURI = 'https://localhost:8243/github-analyse-services/v1/services/DailyJobProxyExecutor';
                    this.$http.post(baseURI, '', {
                        headers: {
                            "Authorization": "Bearer " + this.currentToken
                        }
                    }).then(() => {
                        this.showSuccessAlert();
                    }).catch(() => {
                        this.showFailedAlert();
                    });
                }).catch(() => {
                    this.showFailedAlert();
                });
            }
        }
    }
</script>

<style scoped>
    .header-style {
        margin-top: 5vh;
    }
</style>
