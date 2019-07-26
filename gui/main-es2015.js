(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "./$$_lazy_route_resource lazy recursive":
/*!******************************************************!*\
  !*** ./$$_lazy_route_resource lazy namespace object ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/analysis/analysis.component.html":
/*!***************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/analysis/analysis.component.html ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom\">\r\n  <p>Analysis for {{ context.databaseName }}</p>\r\n</div>\r\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/app.component.html":
/*!*************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/app.component.html ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<nav class=\"navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow\">\r\n  <a class=\"navbar-brand mr-sm-4\" routerLink=\"\">\r\n    <b style=\"margin-left: 10px\"> AetherOnePi V1.1</b></a>\r\n  <input class=\"form-control form-control-dark w-100\" type=\"text\" placeholder=\"Search\" aria-label=\"Search\">\r\n  <ul class=\"navbar-nav px-3\">\r\n    <li class=\"nav-item text-nowrap\">\r\n      <a class=\"nav-link\" routerLink=\"\"></a>\r\n    </li>\r\n  </ul>\r\n</nav>\r\n\r\n<div class=\"container-fluid\">\r\n  <div class=\"row\">\r\n    <app-sidebar></app-sidebar>\r\n    <main role=\"main\" class=\"col-sm-9 ml-sm-auto col-lg-10 px-4\">\r\n      <router-outlet></router-outlet>\r\n      <app-status></app-status>\r\n    </main>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/dashboard/dashboard.component.html":
/*!*****************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/dashboard/dashboard.component.html ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom\">\r\n  <h1 class=\"h2\"><img height=\"40\" src=\"/assets/AetherOneLogo.png\"> Dashboard</h1>\r\n  <div class=\"btn-toolbar mb-2 mb-md-0\">\r\n    <div class=\"btn-group mr-2\">\r\n      <button type=\"button\" class=\"btn btn-sm btn-outline-secondary\">Share</button>\r\n      <button type=\"button\" class=\"btn btn-sm btn-outline-secondary\">Export</button>\r\n    </div>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/map/map.component.html":
/*!*****************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/map/map.component.html ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div id=\"map\" class=\"map\"></div>\r\n<hr>\r\n<div class=\"btn-toolbar\" role=\"toolbar\">\r\n  <div class=\"btn-group mr-2\" role=\"group\">\r\n    <button class=\"btn btn-primary\">SCAN</button>\r\n  </div>\r\n  <div class=\"btn-group\" role=\"group\">\r\n    <button class=\"btn btn-success\">BROADCAST</button>\r\n  </div>\r\n</div>\r\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/session/session.component.html":
/*!*************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/session/session.component.html ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p>session works!</p>\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/sidebar/sidebar.component.html":
/*!*************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/sidebar/sidebar.component.html ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<nav class=\"col-sm-2 d-none d-md-block bg-light sidebar\">\r\n  <div class=\"sidebar-sticky\">\r\n    <ul class=\"nav flex-column\">\r\n      <li class=\"nav-item\">\r\n        <a class=\"nav-link active\" routerLink=\"\">\r\n          <i class=\"fas fa-home\"></i>\r\n          Dashboard <span class=\"sr-only\">(current)</span>\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"session\" class=\"nav-link btn-light\" style=\"color: black !important;\">\r\n          <i class=\"fas fa-male\"></i>\r\n          Session\r\n        </a>\r\n      </li>\r\n    </ul>\r\n\r\n    <h6 class=\"sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted\">\r\n      <span>Analysis</span>\r\n    </h6>\r\n    <ul class=\"nav flex-column mb-2\">\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-primary\" (click)=\"setDatabaseName('homeopathy')\">\r\n          <i class=\"fas fa-prescription-bottle\"></i>\r\n          Homeopathy\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-success\" (click)=\"setDatabaseName('agriculture')\">\r\n          <i class=\"fas fa-compass\"></i>\r\n          Agriculture\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-danger\" (click)=\"setDatabaseName('energy')\">\r\n          <i class=\"fas fa-battery-half\"></i>\r\n          Energy\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-warning\" style=\"color: black !important;\" (click)=\"setDatabaseName('biology')\">\r\n          <i class=\"fas fa-diagnoses\"></i>\r\n          Biology\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-secondary\" (click)=\"setDatabaseName('chemical')\">\r\n          <i class=\"fas fa-diagnoses\"></i>\r\n          Chemical\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-info\" (click)=\"setDatabaseName('essences')\">\r\n          <i class=\"fas fa-diagnoses\"></i>\r\n          Essences\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"analysis\" class=\"nav-link btn-dark\" (click)=\"setDatabaseName('food')\">\r\n          <i class=\"fas fa-diagnoses\"></i>\r\n          Food\r\n        </a>\r\n      </li>\r\n      <li class=\"nav-item\">\r\n        <a routerLink=\"map\" class=\"nav-link btn-dark\">\r\n          <i class=\"fas fa-map\"></i>\r\n          Map\r\n        </a>\r\n      </li>\r\n    </ul>\r\n  </div>\r\n</nav>\r\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/app/components/status/status.component.html":
/*!***********************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/app/components/status/status.component.html ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"statusComponent\">\r\n  <ul *ngIf=\"aetherOnePiStatus != null\">\r\n    <li *ngIf=\"aetherOnePiStatus.pseudoRandom == false\"><span class=\"badge badge-danger\">Simulation Mode</span></li>\r\n    <li><span class=\"badge badge-primary\">hotbitsPackages {{aetherOnePiStatus.hotbitsPackages}}</span></li>\r\n    <li *ngIf=\"aetherOnePiStatus.broadcasting == true\"><span class=\"badge badge-success\">broadcasting</span></li>\r\n    <li *ngIf=\"aetherOnePiStatus.grounding == true\"><span class=\"badge badge-success\">grounding</span></li>\r\n    <li *ngIf=\"aetherOnePiStatus.copying == true\"><span class=\"badge badge-success\">copying</span></li>\r\n    <li *ngIf=\"aetherOnePiStatus.clearing == true\"><span class=\"badge badge-info\">clearing</span></li>\r\n    <li *ngIf=\"aetherOnePiStatus.text != null && aetherOnePiStatus.text.length > 0\"><span\r\n      class=\"badge badge-secondary\">{{aetherOnePiStatus.text}}</span></li>\r\n  </ul>\r\n\r\n  <span *ngIf=\"aetherOnePiStatus == null\" class=\"badge badge-warning\">No connection to AetherOnePi Server</span>\r\n  <p *ngIf=\"aetherOnePiStatus != null && aetherOnePiStatus.progress > 0\"><ngb-progressbar type=\"primary\" [value]=\"aetherOnePiStatus.progress\" [striped]=\"true\" [animated]=\"true\"><i>progress {{aetherOnePiStatus.progress}}%</i></ngb-progressbar></p>\r\n  <p *ngIf=\"aetherOnePiStatus != null && aetherOnePiStatus.queue > 0\"><ngb-progressbar type=\"primary\" [value]=\"aetherOnePiStatus.queue\" [striped]=\"true\" [animated]=\"true\"><i>queue {{aetherOnePiStatus.queue}}%</i></ngb-progressbar></p>\r\n</div>\r\n"

/***/ }),

/***/ "./src/app/app-routing.module.ts":
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/*! exports provided: AppRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppRoutingModule", function() { return AppRoutingModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
/* harmony import */ var _components_dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/dashboard/dashboard.component */ "./src/app/components/dashboard/dashboard.component.ts");
/* harmony import */ var _components_analysis_analysis_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/analysis/analysis.component */ "./src/app/components/analysis/analysis.component.ts");
/* harmony import */ var _components_session_session_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/session/session.component */ "./src/app/components/session/session.component.ts");
/* harmony import */ var _components_map_map_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./components/map/map.component */ "./src/app/components/map/map.component.ts");







const routes = [
    { path: '', component: _components_dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_3__["DashboardComponent"] },
    { path: 'dashboard', component: _components_dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_3__["DashboardComponent"] },
    { path: 'session', component: _components_session_session_component__WEBPACK_IMPORTED_MODULE_5__["SessionComponent"] },
    { path: 'analysis', component: _components_analysis_analysis_component__WEBPACK_IMPORTED_MODULE_4__["AnalysisComponent"] },
    { path: 'map', component: _components_map_map_component__WEBPACK_IMPORTED_MODULE_6__["MapComponent"] }
];
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
        imports: [_angular_router__WEBPACK_IMPORTED_MODULE_2__["RouterModule"].forRoot(routes)],
        exports: [_angular_router__WEBPACK_IMPORTED_MODULE_2__["RouterModule"]]
    })
], AppRoutingModule);



/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm2015/platform-browser.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm2015/http.js");
/* harmony import */ var _app_routing_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./app-routing.module */ "./src/app/app-routing.module.ts");
/* harmony import */ var _components_app_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/app.component */ "./src/app/components/app.component.ts");
/* harmony import */ var _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ng-bootstrap/ng-bootstrap */ "./node_modules/@ng-bootstrap/ng-bootstrap/index.js");
/* harmony import */ var _components_dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/dashboard/dashboard.component */ "./src/app/components/dashboard/dashboard.component.ts");
/* harmony import */ var _components_analysis_analysis_component__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./components/analysis/analysis.component */ "./src/app/components/analysis/analysis.component.ts");
/* harmony import */ var _components_sidebar_sidebar_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./components/sidebar/sidebar.component */ "./src/app/components/sidebar/sidebar.component.ts");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
/* harmony import */ var _components_session_session_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./components/session/session.component */ "./src/app/components/session/session.component.ts");
/* harmony import */ var _components_status_status_component__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./components/status/status.component */ "./src/app/components/status/status.component.ts");
/* harmony import */ var _components_map_map_component__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./components/map/map.component */ "./src/app/components/map/map.component.ts");














let AppModule = class AppModule {
};
AppModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"])({
        declarations: [
            _components_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"],
            _components_dashboard_dashboard_component__WEBPACK_IMPORTED_MODULE_7__["DashboardComponent"],
            _components_analysis_analysis_component__WEBPACK_IMPORTED_MODULE_8__["AnalysisComponent"],
            _components_sidebar_sidebar_component__WEBPACK_IMPORTED_MODULE_9__["SidebarComponent"],
            _components_session_session_component__WEBPACK_IMPORTED_MODULE_11__["SessionComponent"],
            _components_status_status_component__WEBPACK_IMPORTED_MODULE_12__["StatusComponent"],
            _components_map_map_component__WEBPACK_IMPORTED_MODULE_13__["MapComponent"]
        ],
        imports: [
            _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"],
            _app_routing_module__WEBPACK_IMPORTED_MODULE_4__["AppRoutingModule"],
            _angular_forms__WEBPACK_IMPORTED_MODULE_10__["ReactiveFormsModule"],
            _ng_bootstrap_ng_bootstrap__WEBPACK_IMPORTED_MODULE_6__["NgbModule"].forRoot(),
            _angular_common_http__WEBPACK_IMPORTED_MODULE_3__["HttpClientModule"]
        ],
        providers: [],
        bootstrap: [_components_app_component__WEBPACK_IMPORTED_MODULE_5__["AppComponent"]]
    })
], AppModule);



/***/ }),

/***/ "./src/app/components/analysis/analysis.component.scss":
/*!*************************************************************!*\
  !*** ./src/app/components/analysis/analysis.component.scss ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvYW5hbHlzaXMvYW5hbHlzaXMuY29tcG9uZW50LnNjc3MifQ== */"

/***/ }),

/***/ "./src/app/components/analysis/analysis.component.ts":
/*!***********************************************************!*\
  !*** ./src/app/components/analysis/analysis.component.ts ***!
  \***********************************************************/
/*! exports provided: AnalysisComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AnalysisComponent", function() { return AnalysisComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _services_context_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/context.service */ "./src/app/services/context.service.ts");



let AnalysisComponent = class AnalysisComponent {
    constructor(contextService) {
        this.contextService = contextService;
    }
    ngOnInit() {
        this.context = this.contextService.getContext();
    }
};
AnalysisComponent.ctorParameters = () => [
    { type: _services_context_service__WEBPACK_IMPORTED_MODULE_2__["ContextService"] }
];
AnalysisComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-analysis',
        template: __webpack_require__(/*! raw-loader!./analysis.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/analysis/analysis.component.html"),
        styles: [__webpack_require__(/*! ./analysis.component.scss */ "./src/app/components/analysis/analysis.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_services_context_service__WEBPACK_IMPORTED_MODULE_2__["ContextService"]])
], AnalysisComponent);



/***/ }),

/***/ "./src/app/components/app.component.scss":
/*!***********************************************!*\
  !*** ./src/app/components/app.component.scss ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".bd-placeholder-img {\n  font-size: 1.125rem;\n  text-anchor: middle;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n@media (min-width: 768px) {\n  .bd-placeholder-img-lg {\n    font-size: 3.5rem;\n  }\n}\n\nbody {\n  font-size: 0.875rem !important;\n  font-family: Nunito, sans-serif !important;\n}\n\n@media (min-width: 1024px) {\n  .ml-sm-auto, .mx-sm-auto {\n    margin-left: 200px !important;\n  }\n}\n\nmain {\n  color: #ffffff;\n}\n\n.feather {\n  vertical-align: text-bottom;\n}\n\n@media (min-width: 768px) {\n  [role=main] {\n    /* Space for fixed navbar */\n    padding-top: 48px;\n  }\n}\n\n.bg-dark {\n  background-color: #130c09 !important;\n}\n\n/*\n * Navbar\n */\n\n.navbar-brand {\n  padding-top: 0.75rem;\n  padding-bottom: 0.75rem;\n  font-size: 1rem;\n  background-color: #130c09;\n  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.25);\n}\n\n.navbar .form-control {\n  padding: 0.75rem 1rem;\n  border-width: 0;\n  border-radius: 0;\n  background-color: #130c09;\n}\n\n.form-control-dark {\n  color: #fff;\n  background-color: #1c1209;\n  border-color: #130c09;\n}\n\n.form-control-dark:focus {\n  border-color: transparent;\n  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvY29tcG9uZW50cy9FOlxcR0lUSFVCXFxBZXRoZXJPbmVQaVxcQWV0aGVyT25lUGlcXGd1aS9zcmNcXGFwcFxcY29tcG9uZW50c1xcYXBwLmNvbXBvbmVudC5zY3NzIiwic3JjL2FwcC9jb21wb25lbnRzL2FwcC5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLG1CQUFBO0VBQ0EsbUJBQUE7RUFDQSx5QkFBQTtFQUNBLHNCQUFBO0VBQ0EscUJBQUE7RUFDQSxpQkFBQTtBQ0NGOztBREVBO0VBQ0U7SUFDRSxpQkFBQTtFQ0NGO0FBQ0Y7O0FERUE7RUFDRSw4QkFBQTtFQUNBLDBDQUFBO0FDQUY7O0FER0E7RUFDRTtJQUNFLDZCQUFBO0VDQUY7QUFDRjs7QURHQTtFQUNFLGNBQUE7QUNERjs7QURJQTtFQUNFLDJCQUFBO0FDREY7O0FESUE7RUFDRTtJQUNFLDJCQUFBO0lBQ0EsaUJBQUE7RUNERjtBQUNGOztBRElBO0VBQ0Usb0NBQUE7QUNGRjs7QURLQTs7RUFBQTs7QUFHQTtFQUNFLG9CQUFBO0VBQ0EsdUJBQUE7RUFDQSxlQUFBO0VBQ0EseUJBQUE7RUFDQSw4Q0FBQTtBQ0ZGOztBREtBO0VBQ0UscUJBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSx5QkFBQTtBQ0ZGOztBREtBO0VBQ0UsV0FBQTtFQUNBLHlCQUFBO0VBQ0EscUJBQUE7QUNGRjs7QURLQTtFQUNFLHlCQUFBO0VBQ0EsK0NBQUE7QUNGRiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvYXBwLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmJkLXBsYWNlaG9sZGVyLWltZyB7XHJcbiAgZm9udC1zaXplOiAxLjEyNXJlbTtcclxuICB0ZXh0LWFuY2hvcjogbWlkZGxlO1xyXG4gIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XHJcbiAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcclxuICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XHJcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XHJcbn1cclxuXHJcbkBtZWRpYSAobWluLXdpZHRoOiA3NjhweCkge1xyXG4gIC5iZC1wbGFjZWhvbGRlci1pbWctbGcge1xyXG4gICAgZm9udC1zaXplOiAzLjVyZW07XHJcbiAgfVxyXG59XHJcblxyXG5ib2R5IHtcclxuICBmb250LXNpemU6IC44NzVyZW0gIWltcG9ydGFudDtcclxuICBmb250LWZhbWlseTogTnVuaXRvLHNhbnMtc2VyaWYgIWltcG9ydGFudDtcclxufVxyXG5cclxuQG1lZGlhIChtaW4td2lkdGg6IDEwMjRweCkge1xyXG4gIC5tbC1zbS1hdXRvLCAubXgtc20tYXV0byB7XHJcbiAgICBtYXJnaW4tbGVmdDogMjAwcHggIWltcG9ydGFudDtcclxuICB9XHJcbn1cclxuXHJcbm1haW4ge1xyXG4gIGNvbG9yOiAjZmZmZmZmO1xyXG59XHJcblxyXG4uZmVhdGhlciB7XHJcbiAgdmVydGljYWwtYWxpZ246IHRleHQtYm90dG9tO1xyXG59XHJcblxyXG5AbWVkaWEgKG1pbi13aWR0aDogNzY4cHgpIHtcclxuICBbcm9sZT1cIm1haW5cIl0ge1xyXG4gICAgLyogU3BhY2UgZm9yIGZpeGVkIG5hdmJhciAqL1xyXG4gICAgcGFkZGluZy10b3A6IDQ4cHg7XHJcbiAgfVxyXG59XHJcblxyXG4uYmctZGFyayB7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEzMGMwOSAhaW1wb3J0YW50O1xyXG59XHJcblxyXG4vKlxyXG4gKiBOYXZiYXJcclxuICovXHJcbi5uYXZiYXItYnJhbmQge1xyXG4gIHBhZGRpbmctdG9wOiAuNzVyZW07XHJcbiAgcGFkZGluZy1ib3R0b206IC43NXJlbTtcclxuICBmb250LXNpemU6IDFyZW07XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEzMGMwOTtcclxuICBib3gtc2hhZG93OiBpbnNldCAtMXB4IDAgMCByZ2JhKDAsIDAsIDAsIC4yNSk7XHJcbn1cclxuXHJcbi5uYXZiYXIgLmZvcm0tY29udHJvbCB7XHJcbiAgcGFkZGluZzogLjc1cmVtIDFyZW07XHJcbiAgYm9yZGVyLXdpZHRoOiAwO1xyXG4gIGJvcmRlci1yYWRpdXM6IDA7XHJcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEzMGMwOTtcclxufVxyXG5cclxuLmZvcm0tY29udHJvbC1kYXJrIHtcclxuICBjb2xvcjogI2ZmZjtcclxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWMxMjA5O1xyXG4gIGJvcmRlci1jb2xvcjogIzEzMGMwOTtcclxufVxyXG5cclxuLmZvcm0tY29udHJvbC1kYXJrOmZvY3VzIHtcclxuICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xyXG4gIGJveC1zaGFkb3c6IDAgMCAwIDNweCByZ2JhKDI1NSwgMjU1LCAyNTUsIC4yNSk7XHJcbn1cclxuIiwiLmJkLXBsYWNlaG9sZGVyLWltZyB7XG4gIGZvbnQtc2l6ZTogMS4xMjVyZW07XG4gIHRleHQtYW5jaG9yOiBtaWRkbGU7XG4gIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7XG4gIC1tb3otdXNlci1zZWxlY3Q6IG5vbmU7XG4gIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbkBtZWRpYSAobWluLXdpZHRoOiA3NjhweCkge1xuICAuYmQtcGxhY2Vob2xkZXItaW1nLWxnIHtcbiAgICBmb250LXNpemU6IDMuNXJlbTtcbiAgfVxufVxuYm9keSB7XG4gIGZvbnQtc2l6ZTogMC44NzVyZW0gIWltcG9ydGFudDtcbiAgZm9udC1mYW1pbHk6IE51bml0bywgc2Fucy1zZXJpZiAhaW1wb3J0YW50O1xufVxuXG5AbWVkaWEgKG1pbi13aWR0aDogMTAyNHB4KSB7XG4gIC5tbC1zbS1hdXRvLCAubXgtc20tYXV0byB7XG4gICAgbWFyZ2luLWxlZnQ6IDIwMHB4ICFpbXBvcnRhbnQ7XG4gIH1cbn1cbm1haW4ge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZlYXRoZXIge1xuICB2ZXJ0aWNhbC1hbGlnbjogdGV4dC1ib3R0b207XG59XG5cbkBtZWRpYSAobWluLXdpZHRoOiA3NjhweCkge1xuICBbcm9sZT1tYWluXSB7XG4gICAgLyogU3BhY2UgZm9yIGZpeGVkIG5hdmJhciAqL1xuICAgIHBhZGRpbmctdG9wOiA0OHB4O1xuICB9XG59XG4uYmctZGFyayB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMzBjMDkgIWltcG9ydGFudDtcbn1cblxuLypcbiAqIE5hdmJhclxuICovXG4ubmF2YmFyLWJyYW5kIHtcbiAgcGFkZGluZy10b3A6IDAuNzVyZW07XG4gIHBhZGRpbmctYm90dG9tOiAwLjc1cmVtO1xuICBmb250LXNpemU6IDFyZW07XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMzBjMDk7XG4gIGJveC1zaGFkb3c6IGluc2V0IC0xcHggMCAwIHJnYmEoMCwgMCwgMCwgMC4yNSk7XG59XG5cbi5uYXZiYXIgLmZvcm0tY29udHJvbCB7XG4gIHBhZGRpbmc6IDAuNzVyZW0gMXJlbTtcbiAgYm9yZGVyLXdpZHRoOiAwO1xuICBib3JkZXItcmFkaXVzOiAwO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTMwYzA5O1xufVxuXG4uZm9ybS1jb250cm9sLWRhcmsge1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzFjMTIwOTtcbiAgYm9yZGVyLWNvbG9yOiAjMTMwYzA5O1xufVxuXG4uZm9ybS1jb250cm9sLWRhcms6Zm9jdXMge1xuICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xuICBib3gtc2hhZG93OiAwIDAgMCAzcHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KTtcbn0iXX0= */"

/***/ }),

/***/ "./src/app/components/app.component.ts":
/*!*********************************************!*\
  !*** ./src/app/components/app.component.ts ***!
  \*********************************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");


let AppComponent = class AppComponent {
    constructor() {
        this.title = 'gui';
    }
};
AppComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-root',
        template: __webpack_require__(/*! raw-loader!./app.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/app.component.html"),
        styles: [__webpack_require__(/*! ./app.component.scss */ "./src/app/components/app.component.scss")]
    })
], AppComponent);



/***/ }),

/***/ "./src/app/components/dashboard/dashboard.component.scss":
/*!***************************************************************!*\
  !*** ./src/app/components/dashboard/dashboard.component.scss ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvZGFzaGJvYXJkL2Rhc2hib2FyZC5jb21wb25lbnQuc2NzcyJ9 */"

/***/ }),

/***/ "./src/app/components/dashboard/dashboard.component.ts":
/*!*************************************************************!*\
  !*** ./src/app/components/dashboard/dashboard.component.ts ***!
  \*************************************************************/
/*! exports provided: DashboardComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DashboardComponent", function() { return DashboardComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");


let DashboardComponent = class DashboardComponent {
    constructor() { }
    ngOnInit() {
    }
};
DashboardComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-dashboard',
        template: __webpack_require__(/*! raw-loader!./dashboard.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/dashboard/dashboard.component.html"),
        styles: [__webpack_require__(/*! ./dashboard.component.scss */ "./src/app/components/dashboard/dashboard.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
], DashboardComponent);



/***/ }),

/***/ "./src/app/components/map/map.component.scss":
/*!***************************************************!*\
  !*** ./src/app/components/map/map.component.scss ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".map:-moz-full-screen {\n  height: 100%;\n}\n\n.map:-webkit-full-screen {\n  height: 100%;\n}\n\n.map:-ms-fullscreen {\n  height: 100%;\n}\n\n.map:fullscreen {\n  height: 100%;\n}\n\n.ol-rotate {\n  top: 3em;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvY29tcG9uZW50cy9tYXAvRTpcXEdJVEhVQlxcQWV0aGVyT25lUGlcXEFldGhlck9uZVBpXFxndWkvc3JjXFxhcHBcXGNvbXBvbmVudHNcXG1hcFxcbWFwLmNvbXBvbmVudC5zY3NzIiwic3JjL2FwcC9jb21wb25lbnRzL21hcC9tYXAuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxZQUFBO0FDQ0Y7O0FEQ0E7RUFDRSxZQUFBO0FDRUY7O0FEQUE7RUFDRSxZQUFBO0FDR0Y7O0FEREE7RUFDRSxZQUFBO0FDSUY7O0FERkE7RUFDRSxRQUFBO0FDS0YiLCJmaWxlIjoic3JjL2FwcC9jb21wb25lbnRzL21hcC9tYXAuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIubWFwOi1tb3otZnVsbC1zY3JlZW4ge1xyXG4gIGhlaWdodDogMTAwJTtcclxufVxyXG4ubWFwOi13ZWJraXQtZnVsbC1zY3JlZW4ge1xyXG4gIGhlaWdodDogMTAwJTtcclxufVxyXG4ubWFwOi1tcy1mdWxsc2NyZWVuIHtcclxuICBoZWlnaHQ6IDEwMCU7XHJcbn1cclxuLm1hcDpmdWxsc2NyZWVuIHtcclxuICBoZWlnaHQ6IDEwMCU7XHJcbn1cclxuLm9sLXJvdGF0ZSB7XHJcbiAgdG9wOiAzZW07XHJcbn1cclxuIiwiLm1hcDotbW96LWZ1bGwtc2NyZWVuIHtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuXG4ubWFwOi13ZWJraXQtZnVsbC1zY3JlZW4ge1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbi5tYXA6LW1zLWZ1bGxzY3JlZW4ge1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbi5tYXA6ZnVsbHNjcmVlbiB7XG4gIGhlaWdodDogMTAwJTtcbn1cblxuLm9sLXJvdGF0ZSB7XG4gIHRvcDogM2VtO1xufSJdfQ== */"

/***/ }),

/***/ "./src/app/components/map/map.component.ts":
/*!*************************************************!*\
  !*** ./src/app/components/map/map.component.ts ***!
  \*************************************************/
/*! exports provided: MapComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapComponent", function() { return MapComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _map_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../map/map */ "./src/app/map/map.ts");



let MapComponent = class MapComponent {
    constructor() { }
    ngOnInit() {
        this.map = new _map_map__WEBPACK_IMPORTED_MODULE_2__["MapObject"]();
    }
};
MapComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-map',
        template: __webpack_require__(/*! raw-loader!./map.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/map/map.component.html"),
        styles: [__webpack_require__(/*! ./map.component.scss */ "./src/app/components/map/map.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
], MapComponent);



/***/ }),

/***/ "./src/app/components/session/session.component.scss":
/*!***********************************************************!*\
  !*** ./src/app/components/session/session.component.scss ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvc2Vzc2lvbi9zZXNzaW9uLmNvbXBvbmVudC5zY3NzIn0= */"

/***/ }),

/***/ "./src/app/components/session/session.component.ts":
/*!*********************************************************!*\
  !*** ./src/app/components/session/session.component.ts ***!
  \*********************************************************/
/*! exports provided: SessionComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SessionComponent", function() { return SessionComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");


let SessionComponent = class SessionComponent {
    constructor() { }
    ngOnInit() {
    }
};
SessionComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-session',
        template: __webpack_require__(/*! raw-loader!./session.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/session/session.component.html"),
        styles: [__webpack_require__(/*! ./session.component.scss */ "./src/app/components/session/session.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
], SessionComponent);



/***/ }),

/***/ "./src/app/components/sidebar/sidebar.component.scss":
/*!***********************************************************!*\
  !*** ./src/app/components/sidebar/sidebar.component.scss ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "/*\n * Sidebar\n */\n.sidebar {\n  position: fixed;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 100;\n  /* Behind the navbar */\n  padding: 48px 0 0;\n  /* Height of navbar */\n  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);\n  width: 150px !important;\n}\n.sidebar-sticky {\n  position: relative;\n  top: 0;\n  height: calc(100vh - 48px);\n  padding-top: 0.5rem;\n  overflow-x: hidden;\n  overflow-y: auto;\n  /* Scrollable contents if viewport is shorter than content. */\n  background-color: #392a1d;\n  color: #999999;\n}\n@supports ((position: -webkit-sticky) or (position: sticky)) {\n  .sidebar-sticky {\n    position: -webkit-sticky;\n    position: sticky;\n  }\n}\n.sidebar .nav-link {\n  font-weight: 500;\n  color: #333;\n}\n.sidebar .nav-link .feather {\n  margin-right: 4px;\n  color: #999;\n}\n.sidebar .nav-link.active {\n  color: #007bff;\n}\n.sidebar .nav-link:hover .feather,\n.sidebar .nav-link.active .feather {\n  color: inherit;\n}\n.sidebar-heading {\n  font-size: 0.75rem;\n  text-transform: uppercase;\n  color: #dbdbdb !important;\n}\n.nav-link {\n  color: #ffffff !important;\n  font-size: 1rem;\n  font-family: Nunito, sans-serif !important;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvY29tcG9uZW50cy9zaWRlYmFyL0U6XFxHSVRIVUJcXEFldGhlck9uZVBpXFxBZXRoZXJPbmVQaVxcZ3VpL3NyY1xcYXBwXFxjb21wb25lbnRzXFxzaWRlYmFyXFxzaWRlYmFyLmNvbXBvbmVudC5zY3NzIiwic3JjL2FwcC9jb21wb25lbnRzL3NpZGViYXIvc2lkZWJhci5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7RUFBQTtBQUlBO0VBQ0UsZUFBQTtFQUNBLE1BQUE7RUFDQSxTQUFBO0VBQ0EsT0FBQTtFQUNBLFlBQUE7RUFBYyxzQkFBQTtFQUNkLGlCQUFBO0VBQW1CLHFCQUFBO0VBQ25CLDZDQUFBO0VBQ0EsdUJBQUE7QUNFRjtBRENBO0VBQ0Usa0JBQUE7RUFDQSxNQUFBO0VBQ0EsMEJBQUE7RUFDQSxtQkFBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7RUFBa0IsNkRBQUE7RUFDbEIseUJBQUE7RUFDQSxjQUFBO0FDR0Y7QURBQTtFQUNFO0lBQ0Usd0JBQUE7SUFDQSxnQkFBQTtFQ0dGO0FBQ0Y7QURBQTtFQUNFLGdCQUFBO0VBQ0EsV0FBQTtBQ0VGO0FEQ0E7RUFDRSxpQkFBQTtFQUNBLFdBQUE7QUNFRjtBRENBO0VBQ0UsY0FBQTtBQ0VGO0FEQ0E7O0VBRUUsY0FBQTtBQ0VGO0FEQ0E7RUFDRSxrQkFBQTtFQUNBLHlCQUFBO0VBQ0EseUJBQUE7QUNFRjtBRENBO0VBQ0UseUJBQUE7RUFDQSxlQUFBO0VBQ0EsMENBQUE7QUNFRiIsImZpbGUiOiJzcmMvYXBwL2NvbXBvbmVudHMvc2lkZWJhci9zaWRlYmFyLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogU2lkZWJhclxyXG4gKi9cclxuXHJcbi5zaWRlYmFyIHtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgdG9wOiAwO1xyXG4gIGJvdHRvbTogMDtcclxuICBsZWZ0OiAwO1xyXG4gIHotaW5kZXg6IDEwMDsgLyogQmVoaW5kIHRoZSBuYXZiYXIgKi9cclxuICBwYWRkaW5nOiA0OHB4IDAgMDsgLyogSGVpZ2h0IG9mIG5hdmJhciAqL1xyXG4gIGJveC1zaGFkb3c6IGluc2V0IC0xcHggMCAwIHJnYmEoMCwgMCwgMCwgLjEpO1xyXG4gIHdpZHRoOiAxNTBweCAhaW1wb3J0YW50O1xyXG59XHJcblxyXG4uc2lkZWJhci1zdGlja3kge1xyXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICB0b3A6IDA7XHJcbiAgaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNDhweCk7XHJcbiAgcGFkZGluZy10b3A6IC41cmVtO1xyXG4gIG92ZXJmbG93LXg6IGhpZGRlbjtcclxuICBvdmVyZmxvdy15OiBhdXRvOyAvKiBTY3JvbGxhYmxlIGNvbnRlbnRzIGlmIHZpZXdwb3J0IGlzIHNob3J0ZXIgdGhhbiBjb250ZW50LiAqL1xyXG4gIGJhY2tncm91bmQtY29sb3I6ICMzOTJhMWQ7XHJcbiAgY29sb3I6ICM5OTk5OTk7XHJcbn1cclxuXHJcbkBzdXBwb3J0cyAoKHBvc2l0aW9uOiAtd2Via2l0LXN0aWNreSkgb3IgKHBvc2l0aW9uOiBzdGlja3kpKSB7XHJcbiAgLnNpZGViYXItc3RpY2t5IHtcclxuICAgIHBvc2l0aW9uOiAtd2Via2l0LXN0aWNreTtcclxuICAgIHBvc2l0aW9uOiBzdGlja3k7XHJcbiAgfVxyXG59XHJcblxyXG4uc2lkZWJhciAubmF2LWxpbmsge1xyXG4gIGZvbnQtd2VpZ2h0OiA1MDA7XHJcbiAgY29sb3I6ICMzMzM7XHJcbn1cclxuXHJcbi5zaWRlYmFyIC5uYXYtbGluayAuZmVhdGhlciB7XHJcbiAgbWFyZ2luLXJpZ2h0OiA0cHg7XHJcbiAgY29sb3I6ICM5OTk7XHJcbn1cclxuXHJcbi5zaWRlYmFyIC5uYXYtbGluay5hY3RpdmUge1xyXG4gIGNvbG9yOiAjMDA3YmZmO1xyXG59XHJcblxyXG4uc2lkZWJhciAubmF2LWxpbms6aG92ZXIgLmZlYXRoZXIsXHJcbi5zaWRlYmFyIC5uYXYtbGluay5hY3RpdmUgLmZlYXRoZXIge1xyXG4gIGNvbG9yOiBpbmhlcml0O1xyXG59XHJcblxyXG4uc2lkZWJhci1oZWFkaW5nIHtcclxuICBmb250LXNpemU6IC43NXJlbTtcclxuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gIGNvbG9yOiAjZGJkYmRiICFpbXBvcnRhbnQ7XHJcbn1cclxuXHJcbi5uYXYtbGluayB7XHJcbiAgY29sb3I6ICNmZmZmZmYgIWltcG9ydGFudDtcclxuICBmb250LXNpemU6IDFyZW07XHJcbiAgZm9udC1mYW1pbHk6IE51bml0byxzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XHJcbn1cclxuIiwiLypcbiAqIFNpZGViYXJcbiAqL1xuLnNpZGViYXIge1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgYm90dG9tOiAwO1xuICBsZWZ0OiAwO1xuICB6LWluZGV4OiAxMDA7XG4gIC8qIEJlaGluZCB0aGUgbmF2YmFyICovXG4gIHBhZGRpbmc6IDQ4cHggMCAwO1xuICAvKiBIZWlnaHQgb2YgbmF2YmFyICovXG4gIGJveC1zaGFkb3c6IGluc2V0IC0xcHggMCAwIHJnYmEoMCwgMCwgMCwgMC4xKTtcbiAgd2lkdGg6IDE1MHB4ICFpbXBvcnRhbnQ7XG59XG5cbi5zaWRlYmFyLXN0aWNreSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgdG9wOiAwO1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSA0OHB4KTtcbiAgcGFkZGluZy10b3A6IDAuNXJlbTtcbiAgb3ZlcmZsb3cteDogaGlkZGVuO1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICAvKiBTY3JvbGxhYmxlIGNvbnRlbnRzIGlmIHZpZXdwb3J0IGlzIHNob3J0ZXIgdGhhbiBjb250ZW50LiAqL1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzkyYTFkO1xuICBjb2xvcjogIzk5OTk5OTtcbn1cblxuQHN1cHBvcnRzIChwb3NpdGlvbjogLXdlYmtpdC1zdGlja3kpIG9yIChwb3NpdGlvbjogc3RpY2t5KSB7XG4gIC5zaWRlYmFyLXN0aWNreSB7XG4gICAgcG9zaXRpb246IC13ZWJraXQtc3RpY2t5O1xuICAgIHBvc2l0aW9uOiBzdGlja3k7XG4gIH1cbn1cbi5zaWRlYmFyIC5uYXYtbGluayB7XG4gIGZvbnQtd2VpZ2h0OiA1MDA7XG4gIGNvbG9yOiAjMzMzO1xufVxuXG4uc2lkZWJhciAubmF2LWxpbmsgLmZlYXRoZXIge1xuICBtYXJnaW4tcmlnaHQ6IDRweDtcbiAgY29sb3I6ICM5OTk7XG59XG5cbi5zaWRlYmFyIC5uYXYtbGluay5hY3RpdmUge1xuICBjb2xvcjogIzAwN2JmZjtcbn1cblxuLnNpZGViYXIgLm5hdi1saW5rOmhvdmVyIC5mZWF0aGVyLFxuLnNpZGViYXIgLm5hdi1saW5rLmFjdGl2ZSAuZmVhdGhlciB7XG4gIGNvbG9yOiBpbmhlcml0O1xufVxuXG4uc2lkZWJhci1oZWFkaW5nIHtcbiAgZm9udC1zaXplOiAwLjc1cmVtO1xuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICBjb2xvcjogI2RiZGJkYiAhaW1wb3J0YW50O1xufVxuXG4ubmF2LWxpbmsge1xuICBjb2xvcjogI2ZmZmZmZiAhaW1wb3J0YW50O1xuICBmb250LXNpemU6IDFyZW07XG4gIGZvbnQtZmFtaWx5OiBOdW5pdG8sIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbn0iXX0= */"

/***/ }),

/***/ "./src/app/components/sidebar/sidebar.component.ts":
/*!*********************************************************!*\
  !*** ./src/app/components/sidebar/sidebar.component.ts ***!
  \*********************************************************/
/*! exports provided: SidebarComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SidebarComponent", function() { return SidebarComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _services_context_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/context.service */ "./src/app/services/context.service.ts");



let SidebarComponent = class SidebarComponent {
    constructor(contextService) {
        this.contextService = contextService;
    }
    ngOnInit() {
    }
    setDatabaseName(databaseName) {
        this.contextService.setDatabaseName(databaseName);
    }
};
SidebarComponent.ctorParameters = () => [
    { type: _services_context_service__WEBPACK_IMPORTED_MODULE_2__["ContextService"] }
];
SidebarComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-sidebar',
        template: __webpack_require__(/*! raw-loader!./sidebar.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/sidebar/sidebar.component.html"),
        styles: [__webpack_require__(/*! ./sidebar.component.scss */ "./src/app/components/sidebar/sidebar.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_services_context_service__WEBPACK_IMPORTED_MODULE_2__["ContextService"]])
], SidebarComponent);



/***/ }),

/***/ "./src/app/components/status/status.component.scss":
/*!*********************************************************!*\
  !*** ./src/app/components/status/status.component.scss ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".statusComponent {\n  position: fixed;\n  bottom: 10px;\n}\n\nul {\n  list-style-type: none;\n  margin: 0;\n  padding: 0;\n  overflow: hidden;\n}\n\nli {\n  float: left;\n  margin-right: 5px;\n}\n\nli a {\n  display: block;\n  color: white;\n  text-align: center;\n  padding: 16px;\n  text-decoration: none;\n}\n\nli a:hover {\n  background-color: #111111;\n}\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcHAvY29tcG9uZW50cy9zdGF0dXMvRTpcXEdJVEhVQlxcQWV0aGVyT25lUGlcXEFldGhlck9uZVBpXFxndWkvc3JjXFxhcHBcXGNvbXBvbmVudHNcXHN0YXR1c1xcc3RhdHVzLmNvbXBvbmVudC5zY3NzIiwic3JjL2FwcC9jb21wb25lbnRzL3N0YXR1cy9zdGF0dXMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFBO0VBQ0EsWUFBQTtBQ0NGOztBREVBO0VBQ0UscUJBQUE7RUFDQSxTQUFBO0VBQ0EsVUFBQTtFQUNBLGdCQUFBO0FDQ0Y7O0FER0E7RUFDRSxXQUFBO0VBQ0EsaUJBQUE7QUNBRjs7QURHQTtFQUNFLGNBQUE7RUFDQSxZQUFBO0VBQ0Esa0JBQUE7RUFDQSxhQUFBO0VBQ0EscUJBQUE7QUNBRjs7QURHQTtFQUNFLHlCQUFBO0FDQUYiLCJmaWxlIjoic3JjL2FwcC9jb21wb25lbnRzL3N0YXR1cy9zdGF0dXMuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuc3RhdHVzQ29tcG9uZW50IHtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgYm90dG9tOiAxMHB4O1xyXG59XHJcblxyXG51bCB7XHJcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xyXG4gIG1hcmdpbjogMDtcclxuICBwYWRkaW5nOiAwO1xyXG4gIG92ZXJmbG93OiBoaWRkZW47XHJcblxyXG59XHJcblxyXG5saSB7XHJcbiAgZmxvYXQ6IGxlZnQ7XHJcbiAgbWFyZ2luLXJpZ2h0OiA1cHg7XHJcbn1cclxuXHJcbmxpIGEge1xyXG4gIGRpc3BsYXk6IGJsb2NrO1xyXG4gIGNvbG9yOiB3aGl0ZTtcclxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgcGFkZGluZzogMTZweDtcclxuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XHJcbn1cclxuXHJcbmxpIGE6aG92ZXIge1xyXG4gIGJhY2tncm91bmQtY29sb3I6ICMxMTExMTE7XHJcbn1cclxuIiwiLnN0YXR1c0NvbXBvbmVudCB7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgYm90dG9tOiAxMHB4O1xufVxuXG51bCB7XG4gIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuXG5saSB7XG4gIGZsb2F0OiBsZWZ0O1xuICBtYXJnaW4tcmlnaHQ6IDVweDtcbn1cblxubGkgYSB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBjb2xvcjogd2hpdGU7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgcGFkZGluZzogMTZweDtcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xufVxuXG5saSBhOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzExMTExMTtcbn0iXX0= */"

/***/ }),

/***/ "./src/app/components/status/status.component.ts":
/*!*******************************************************!*\
  !*** ./src/app/components/status/status.component.ts ***!
  \*******************************************************/
/*! exports provided: StatusComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StatusComponent", function() { return StatusComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var $environment_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! $environment/environment */ "./src/environments/environment.ts");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm2015/http.js");
/* harmony import */ var rx_polling__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rx-polling */ "./node_modules/rx-polling/lib/index.js");
/* harmony import */ var rx_polling__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(rx_polling__WEBPACK_IMPORTED_MODULE_4__);


// TODO how to switch environment???



let StatusComponent = class StatusComponent {
    constructor(http) {
        this.http = http;
        this.serverUrl = `${$environment_environment__WEBPACK_IMPORTED_MODULE_2__["environment"].serverUrl}:${$environment_environment__WEBPACK_IMPORTED_MODULE_2__["environment"].serverPort}`;
    }
    ngOnInit() {
        console.log(`get status from ${this.serverUrl}/status`);
        rx_polling__WEBPACK_IMPORTED_MODULE_4___default()(this.http.get(`${this.serverUrl}/status`), { interval: 5000 })
            .subscribe((status) => {
            console.log('polling status ...');
            this.aetherOnePiStatus = status;
        }, (error) => {
            // The Observable will throw if it's not able to recover after N attempts
            // By default it will attempts 9 times with exponential delay between each other.
            console.error(error);
        });
        // interval(5000)
        //   .pipe(
        //     startWith(0),
        //     switchMap(() => this.http.get<AetherOnePiStatus>(`${this.serverUrl}/status`))
        //   )
        //   // .pipe(catchError(() => {return empty<AetherOnePiStatus>()}))
        //   .subscribe(res => {
        //     console.log('polling status ...');
        //     this.aetherOnePiStatus = res;
        //   });
    }
};
StatusComponent.ctorParameters = () => [
    { type: _angular_common_http__WEBPACK_IMPORTED_MODULE_3__["HttpClient"] }
];
StatusComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
        selector: 'app-status',
        template: __webpack_require__(/*! raw-loader!./status.component.html */ "./node_modules/raw-loader/index.js!./src/app/components/status/status.component.html"),
        styles: [__webpack_require__(/*! ./status.component.scss */ "./src/app/components/status/status.component.scss")]
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_3__["HttpClient"]])
], StatusComponent);



/***/ }),

/***/ "./src/app/domain/context.ts":
/*!***********************************!*\
  !*** ./src/app/domain/context.ts ***!
  \***********************************/
/*! exports provided: Context */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Context", function() { return Context; });
class Context {
}


/***/ }),

/***/ "./src/app/map/map.ts":
/*!****************************!*\
  !*** ./src/app/map/map.ts ***!
  \****************************/
/*! exports provided: MapObject */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapObject", function() { return MapObject; });
/* harmony import */ var ol_Map__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ol/Map */ "./node_modules/ol/Map.js");
/* harmony import */ var ol_View__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ol/View */ "./node_modules/ol/View.js");
/* harmony import */ var ol_interaction_Draw_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ol/interaction/Draw.js */ "./node_modules/ol/interaction/Draw.js");
/* harmony import */ var ol_layer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ol/layer.js */ "./node_modules/ol/layer.js");
/* harmony import */ var ol_source_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ol/source.js */ "./node_modules/ol/source.js");
/* harmony import */ var ol_control_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ol/control.js */ "./node_modules/ol/control.js");






class MapObject {
    constructor() {
        /**
         * OpenStreetMaps
         */
        this.raster = new ol_layer_js__WEBPACK_IMPORTED_MODULE_3__["Tile"]({
            source: new ol_source_js__WEBPACK_IMPORTED_MODULE_4__["OSM"]()
        });
        this.source = new ol_source_js__WEBPACK_IMPORTED_MODULE_4__["Vector"]({ wrapX: false });
        this.vector = new ol_layer_js__WEBPACK_IMPORTED_MODULE_3__["Vector"]({
            source: this.source
        });
        this.map = new ol_Map__WEBPACK_IMPORTED_MODULE_0__["default"]({
            target: 'map',
            controls: Object(ol_control_js__WEBPACK_IMPORTED_MODULE_5__["defaults"])().extend([
                new ol_control_js__WEBPACK_IMPORTED_MODULE_5__["FullScreen"]()
            ]),
            layers: [
                this.raster, this.vector
            ],
            view: new ol_View__WEBPACK_IMPORTED_MODULE_1__["default"]({
                center: [0, 0],
                zoom: 2
            })
        });
        this.addInteraction('LineString');
    }
    addInteraction(typeSelect) {
        var value = typeSelect;
        if (value !== 'None') {
            this.draw = new ol_interaction_Draw_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
                source: this.source,
                type: typeSelect,
                freehand: true
            });
            this.map.addInteraction(this.draw);
        }
    }
}


/***/ }),

/***/ "./src/app/services/context.service.ts":
/*!*********************************************!*\
  !*** ./src/app/services/context.service.ts ***!
  \*********************************************/
/*! exports provided: ContextService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ContextService", function() { return ContextService; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _domain_context__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../domain/context */ "./src/app/domain/context.ts");



let ContextService = class ContextService {
    constructor() {
        this.context = new _domain_context__WEBPACK_IMPORTED_MODULE_2__["Context"]();
    }
    getContext() {
        return this.context;
    }
    setDatabaseName(databaseName) {
        console.log('databaseName = ' + databaseName);
        this.context.databaseName = databaseName;
    }
};
ContextService = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Injectable"])({
        providedIn: 'root'
    }),
    tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
], ContextService);



/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const environment = {
    production: false,
    serverUrl: 'http://localhost',
    serverPort: 8090
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/* harmony import */ var _angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm2015/platform-browser-dynamic.js");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");




if (_environments_environment__WEBPACK_IMPORTED_MODULE_3__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["enableProdMode"])();
}
Object(_angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_1__["platformBrowserDynamic"])().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_2__["AppModule"])
    .catch(err => console.error(err));


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! E:\GITHUB\AetherOnePi\AetherOnePi\gui\src\main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main-es2015.js.map