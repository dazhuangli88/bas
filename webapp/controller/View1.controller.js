sap.ui.define(
  [
    "sap/ui/core/mvc/Controller", // 导入MVC控制器
    "sap/m/MessageBox", // 导入MessageBox库，用于显示错误信息
    "sap/m/MessageToast", // 导入MessageToast库，用于显示成功信息
    "sap/ui/model/json/JSONModel", // 导入JSONModel库，用于处理和管理数据模型
     "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog", // 引入 ValueHelpDialog 类
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem"
  ],
  function (Controller, MessageBox, MessageToast, JSONModel, Filter, FilterOperator, ValueHelpDialog, FilterBar, FilterGroupItem) {
    "use strict";

    return Controller.extend("ivy.uicomputerrequestappivy.controller.View1", {
      onInit: function () {
        // 初始化函数，在视图实例化时调用
        // 创建JSON模型保存表单数据
        var oViewModel = new JSONModel({
          form: {
            employeeId: "",
            employeeName: "",
            department: "",
            category: "",
            monitorBrand: "",
            hostBrand: "",
            nbBrand: "",
            language: "",
            sysOperation: "",
            purpose: "",
          },
          departments: [], // 初始化 department 数组
        });

        // 将数据模型绑定到视图
        this.getView().setModel(oViewModel, "view");
        // 获取OData模型实例并设置为模型"TrainingDataService"
        this.getView().setModel(this.getOwnerComponent().getModel("TrainingDataService"), "TrainingDataService");
         // 获取部门数据
        
      },

      onEmployeeIdHelp: function () { // 新增内容 - 值帮助功能的实现
        // 创建ValueHelpDialog实例
        if (!this._oValueHelpDialog) {
            this._oValueHelpDialog = new ValueHelpDialog({
                title: "Select Employee",
                supportRanges: false,
                supportRangesOnly: false,
                supportMultiselect: false,
                key: "id",
                descriptionKey: "name",
                ok: function (oEvent) {
                    var aTokens = oEvent.getParameter("tokens");
                    if (aTokens.length) {
                        var sSelectedKey = aTokens[0].getKey();
                        var oViewModel = this.getView().getModel("view");
                        oViewModel.setProperty("/form/employeeId", sSelectedKey); // 设置员工ID
                        this._updateEmployeeData(sSelectedKey);
                    }
                    this._oValueHelpDialog.close();
                }.bind(this),
                cancel: function () {
                    this._oValueHelpDialog.close();
                }.bind(this)
            });

            // 创建FilterBar实例
            this._oFilterBar = new FilterBar({
                advancedMode: true,
                filterBarExpanded: true,
                showClearButton: false,
                filterGroupItems: [
                    new FilterGroupItem({
                        groupName: "group",
                        name: "EmployeeID",
                        label: "Employee ID",
                        control: new sap.m.Input()
                    }),
                    new FilterGroupItem({
                        groupName: "group",
                        name: "EmployeeName",
                        label: "Employee Name",
                        control: new sap.m.Input()
                    })
                ],
                search: this.onFilterBarSearch.bind(this)
            });

            this._oValueHelpDialog.setFilterBar(this._oFilterBar);
            this.getView().addDependent(this._oValueHelpDialog);
        }

        // 绑定表格数据
        var oTable = this._oValueHelpDialog.getTable(); // 获取表格
        oTable.setModel(this.getView().getModel("TrainingDataService")); // 设置数据模型
        oTable.bindRows("/ZTrainingEmployee"); // 绑定数据路径

        this._oValueHelpDialog.open(); // 打开对话框
    },

    onFilterBarSearch: function (oEvent) { // 新增内容 - 搜索过滤的实现
        // 处理FilterBar的搜索请求
        var oFilterItems = oEvent.getParameter("selectionSet");
        var aFilters = [];

        oFilterItems.forEach(function (oItem) {
            var sValue = oItem.getValue();
            if (sValue) {
                switch(oItem.getName()) {
                    case "EmployeeID":
                        aFilters.push(new Filter("id", FilterOperator.Contains, sValue));
                        break;
                    case "EmployeeName":
                        aFilters.push(new Filter("name", FilterOperator.Contains, sValue));
                        break;
                }
            }
        });

        // 过滤表格数据
        var oTable = this._oValueHelpDialog.getTable();
        oTable.getBinding("rows").filter(aFilters);
    },

    onEmployeeIdChange: async function (oEvent) { // 保持原有的OData数据绑定逻辑
        // 当员工ID变化时触发
        var sEmployeeId = oEvent.getSource().getSelectedKey();  // 获取选中的员工ID
        var oModel = this.getView().getModel("TrainingDataService");  // 获取OData模型实例

        var aFilter = [];  // 过滤器数组
        var oContext;  // 上下文实例
        var oData;  // 数据实例

        // 构建过滤条件
        aFilter.push(new Filter("ID", FilterOperator.EQ, sEmployeeId));  // 使用过滤字段 "ID"

        try {
            // 绑定列表并请求上下文
            oContext = await oModel.bindList("/ZTrainingEmployee", undefined, undefined, aFilter, undefined).requestContexts();

            if (oContext && oContext.length > 0) {
                oData = oContext[0].getObject();  // 获取第一个上下文对象的数据

                // 更新表单的数据模型
                var oViewModel = this.getView().getModel("view");
                oViewModel.setProperty("/form/employeeName", oData.name);  // 更新员工姓名
                oViewModel.setProperty("/form/employeeId", oData.ID);  // 更新员工ID
                oViewModel.setProperty("/form/department", oData.department);  // 更新员工部门
                this._updateDepartmentDropdown(oData.department);  // 更新部门下拉列表
                oViewModel.refresh();  // 刷新视图
            } else {
                MessageBox.error("Failed to load employee data.");  // 出错消息
            }
        } catch (oError) {
            MessageBox.error("Failed to load employee data.");  // 错误捕获及处理
        }
    },


      onEmployeeIdChange: async function (oEvent) {
        // 当员工ID变化时触发
        var sEmployeeId = oEvent.getSource().getSelectedKey(); // 获取选中的员工ID
        var oModel = this.getView().getModel("TrainingDataService"); // 获取OData模型实例

        var aFilter = [];  // 过滤器数组
        var oContext = undefined;  // 上下文实例
        var oData;  // 数据实例

        // 构建过滤条件，过滤员工ID
        aFilter.push(
            new Filter("id", FilterOperator.EQ, sEmployeeId)
        );

        try {
            // 绑定列表并请求上下文（异步）
            oContext = await oModel.bindList(
                "/ZTrainingEmployee",
                undefined,
                undefined,
                aFilter,
                undefined
            ).requestContexts();

            if (oContext && oContext.length > 0) {
                oData = oContext[0].getObject();  // 获取第一个上下文对象的具体数据

                var oViewModel = this.getView().getModel("view");  // 获取视图模型
                oViewModel.setProperty("/form/employeeName", oData.name);  // 设置员工姓名
                
                oViewModel.setProperty("/form/employeeId", oData.id);  // 设置员工部门
                oViewModel.setProperty("/form/department", oData.department);  // 设置员工部门
                this._updateDepartmentDropdown(oData.department);  // 更新部门下拉列表
                oViewModel.refresh();  // 刷新视图
            } else {
                MessageBox.error("Failed to load employee data.");  // 弹出错误消息
            }
        } catch (oError) {
            MessageBox.error("Failed to load employee data.");  // 捕获并处理错误
        }
    },
    
      _updateDepartmentDropdown: function (selectedDepartment) {
        // 更新部门下拉列表的函数
        var aDepartments = ["btp", "bw", "apbp"]; // 示例部门列表
        var oViewModel = this.getView().getModel("view");
        oViewModel.setProperty("/departments", aDepartments); // 设置部门数据
        var oDepartmentComboBox = this.byId("department"); // 获取部门下拉框实例
        oDepartmentComboBox.removeAllItems(); // 移除所有项目项
        aDepartments.forEach(function (dep) {
          oDepartmentComboBox.addItem(
            new sap.ui.core.Item({ key: dep, text: dep })
          ); // 添加项目项
        });
        oDepartmentComboBox.setSelectedKey(selectedDepartment); // 设置选中项
      },

      onCategoryChange: function (oEvent) {
        // 当类别变化时触发
        var sCategory = oEvent.getSource().getSelectedKey(); // 获取选中的类别
        var bIsDT = sCategory === "DT";
        var bIsNB = sCategory === "NB";

        // 根据类别显示或隐藏对应的输入项
        this.byId("monitorBrandHbox").setVisible(bIsDT);
        this.byId("hostBrandHbox").setVisible(bIsDT);
        this.byId("nbBrandHbox").setVisible(bIsNB);
      },

      onSubmit: function () {
        // 提交表单时触发
        var oViewModel = this.getView().getModel("view");
        var oForm = oViewModel.getProperty("/form");
        console.log("Form.Data:",oForm);

        // 验证输入项
        if (!this._validateForm(oForm)) {
          return; // 如果验证失败，返回
        }

        // 构建表单数据
        var oData = {
          employee_id: oForm.employeeId,
          employee_name: oForm.employeeName,
          Department: oForm.department,
          Category: oForm.category,
          MonitorBrand: oForm.monitorBrand,
          HostBrand: oForm.hostBrand,
          NBBrand: oForm.nbBrand,
          Language: oForm.language,
          SysOperation: oForm.sysOperation,
          Purpose: oForm.purpose,
        };
        console.log("Data to be submitted:", oData);

        // 提交表单数据到OData服务
        // var oModel = this.getView().getModel("TrainingDataService");
        // oModel.bindList("/ZTrainingFormHead").create({}, oData);
        //      // 提交批处理请求
        //   oModel.submitBatch("save");
        var oModel = this.getView().getModel("TrainingDataService");
        oModel.bindList("/ZTrainingFormHead").create({ 
          id: "124",
          employee_id: oForm.employeeId,
          employee_name: oForm.employeeName,
          Department: oForm.department,
          Category: oForm.category,
          MonitorBrand: oForm.monitorBrand,
          HostBrand: oForm.hostBrand,
          NBBrand: oForm.nbBrand,
          Language: oForm.language,
          SysOperation: oForm.sysOperation,
          Purpose: oForm.purpose,})
      
        oModel.submitBatch("save");

      },

      _validateForm: function (oForm) {
        // 验证表单数据的函数
        // 验证员工ID和部门
        if (!oForm.employeeId || !oForm.department) {
          MessageBox.error("Employee ID and Department are required.");
          return false;
        }

        // 验证语言
        if (!["EN", "ZH", "ZF"].includes(oForm.language)) {
          MessageBox.error("Invalid language. Must be EN/ZH/ZF.");
          return false;
        }

        // 验证操作系统
        if (
          oForm.category === "NB" &&
          !["Win10", "Win11"].includes(oForm.sysOperation)
        ) {
          MessageBox.error(
            "Invalid system operation for NB. Must be Win10/Win11."
          );
          return false;
        }

        if (
          oForm.category === "DT" &&
          !["Win7", "Win10", "Win11"].includes(oForm.sysOperation)
        ) {
          MessageBox.warning("The selected Win7 version has expired.");
        }

        // 验证申请目的
        if (!oForm.purpose) {
          MessageBox.error("Purpose is required.");
          return false;
        }

        return true;
      },

      _triggerWorkflow: function (oData) {
        // 触发工作流的函数
        // 实现工作流触发的逻辑
        // 这里应该实现调用工作流的逻辑
      },
    });
  }
);
