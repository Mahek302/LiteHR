import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FiDownload, FiCheckCircle, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { addCorporatePdfHeader, addCorporatePdfFooters } from "../../../utils/corporatePdf";
import { useTheme, getThemeClasses } from "../../../contexts/ThemeContext";

const AdminPayslip = () => {
  const darkMode = useTheme() === true;
  const themeClasses = getThemeClasses(darkMode);

  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayslips();
    fetchEmployees();
  }, []);

  const fetchPayslips = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/payslips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayslips(response.data);
    } catch (error) {
      console.error("Error fetching payslips:", error);
      toast.error("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const validEmployees = response.data
        .filter((user) => user.employee || user.employeeProfile)
        .map((user) => {
          const emp = user.employee || user.employeeProfile;
          return {
            id: emp.id,
            fullName: emp.fullName,
            employeeCode: emp.employeeCode,
          };
        });

      setEmployees(validEmployees);
    } catch (error) {
      console.error("Error fetching employees for dropdown:", error);
    }
  };

  const handleGeneratePayslip = async (e) => {
    e.preventDefault();

    if (!generateData.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/payslips/generate", generateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Payslip generated successfully");
      setShowGenerateModal(false);
      fetchPayslips();
    } catch (error) {
      console.error("Generate error:", error);
      toast.error(error.response?.data?.message || "Failed to generate payslip");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/payslips/${id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Payslip published successfully");
      fetchPayslips();
    } catch (error) {
      toast.error("Failed to publish payslip");
    }
  };

  const handleDownload = async (payslip) => {
    try {
      const doc = new jsPDF();
      const y = await addCorporatePdfHeader(doc, {
        title: "Employee Payslip",
        subtitle: `${new Date(0, payslip.month - 1).toLocaleString("default", {
          month: "long",
        })} ${payslip.year}`,
      });

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, y, 182, 45, 3, 3, "FD");

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Employee Name:", 20, y + 10);
      doc.setFont("helvetica", "normal");
      doc.text(payslip.employee?.fullName || "N/A", 60, y + 10);

      doc.setFont("helvetica", "bold");
      doc.text("Employee Code:", 20, y + 20);
      doc.setFont("helvetica", "normal");
      doc.text(payslip.employee?.employeeCode || "N/A", 60, y + 20);

      doc.setFont("helvetica", "bold");
      doc.text("Designation:", 20, y + 30);
      doc.setFont("helvetica", "normal");
      doc.text(payslip.employee?.designation || "N/A", 60, y + 30);

      doc.setFont("helvetica", "bold");
      doc.text("Department:", 110, y + 10);
      doc.setFont("helvetica", "normal");
      doc.text(payslip.employee?.department || "N/A", 150, y + 10);

      doc.setFont("helvetica", "bold");
      doc.text("Working Days:", 110, y + 20);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.workingDays || 0), 150, y + 20);

      doc.setFont("helvetica", "bold");
      doc.text("Present Days:", 110, y + 30);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.presentDays || 0), 150, y + 30);

      doc.setFont("helvetica", "bold");
      doc.text("LOP Days:", 110, y + 40);
      doc.setFont("helvetica", "normal");
      doc.text(String(payslip.unpaidLeaves || 0), 150, y + 40);

      const columns = ["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"];
      const basicSalary = parseFloat(payslip.basicSalary || 0);
      const deduction = parseFloat(payslip.deduction || 0);
      const netSalary = parseFloat(payslip.netSalary || 0);

      const data = [
        ["Basic Salary", basicSalary.toFixed(2), "Unpaid Leave Deduction", deduction.toFixed(2)],
        ["House Rent Allowance", "0.00", "Provident Fund", "0.00"],
        ["Special Allowance", "0.00", "Professional Tax", "0.00"],
        ["", "", "", ""],
        ["Total Earnings", basicSalary.toFixed(2), "Total Deductions", deduction.toFixed(2)],
      ];

      autoTable(doc, {
        startY: y + 55,
        head: [columns],
        body: data,
        theme: "grid",
        headStyles: { fillColor: [139, 92, 246] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: "bold" },
          2: { fontStyle: "bold" },
          1: { halign: "right" },
          3: { halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(14, finalY, 182, 15, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("NET SALARY PAYABLE:", 20, finalY + 10);
      doc.text(
        "Rs. " + netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        190,
        finalY + 10,
        { align: "right" }
      );

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This is a computer-generated document and does not require a signature.",
        105,
        280,
        { align: "center" }
      );

      addCorporatePdfFooters(doc);
      doc.save(`Payslip_${payslip.employee?.fullName}_${payslip.month}_${payslip.year}.pdf`);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch =
      payslip.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || payslip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`p-6 relative rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Payslips</h1>
          <p className={themeClasses.text.secondary}>Manage employee payslips</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus /> Generate Payslip
        </button>
      </div>

      <div className={`${themeClasses.bg.tertiary} p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center border ${themeClasses.border.primary}`}>
        <div className="relative flex-1">
          <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${themeClasses.text.muted}`} />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className={`border rounded-lg px-3 py-2 ${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      <div className={`${themeClasses.bg.tertiary} rounded-lg shadow overflow-hidden border ${themeClasses.border.primary}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${darkMode ? "bg-slate-800 text-slate-200" : "bg-violet-50 text-slate-600"} text-sm uppercase`}>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Month/Year</th>
                <th className="px-6 py-3 font-medium">Net Salary</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-200"} text-sm`}>
              {loading ? (
                <tr>
                  <td colSpan="5" className={`px-6 py-8 text-center ${themeClasses.text.muted}`}>
                    Loading payslips...
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`px-6 py-8 text-center ${themeClasses.text.muted}`}>
                    No payslips found.
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((payslip) => (
                  <tr
                    key={payslip.id}
                    className={`${darkMode ? "bg-slate-900/40 hover:bg-slate-800/70" : "bg-white hover:bg-violet-50"} transition-colors`}
                  >
                    <td className={`px-6 py-4 ${themeClasses.text.primary}`}>
                      <div className="font-medium">{payslip.employee?.fullName || "Unknown"}</div>
                      <div className={`text-xs ${themeClasses.text.muted}`}>{payslip.employee?.employeeCode}</div>
                    </td>
                    <td className={`px-6 py-4 ${themeClasses.text.primary}`}>{payslip.month}/{payslip.year}</td>
                    <td className={`px-6 py-4 ${themeClasses.text.primary} font-medium`}>
                      Rs. {parseFloat(payslip.netSalary).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payslip.status === "PUBLISHED"
                            ? darkMode
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-100 text-green-700"
                            : darkMode
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {payslip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {payslip.status === "DRAFT" && (
                        <button
                          onClick={() => handlePublish(payslip.id)}
                          className={`font-medium ${darkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"}`}
                          title="Publish"
                        >
                          <FiCheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(payslip)}
                        className={`${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-800"}`}
                        title="Download PDF"
                      >
                        <FiDownload size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl w-full max-w-md p-6 border ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text.primary}`}>Generate Payslip</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className={`${themeClasses.text.muted} ${darkMode ? "hover:text-slate-200" : "hover:text-slate-700"}`}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleGeneratePayslip} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${themeClasses.text.secondary}`}>Select Employee</label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  value={generateData.employeeId}
                  onChange={(e) => setGenerateData({ ...generateData, employeeId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text.secondary}`}>Month</label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={generateData.month}
                    onChange={(e) => setGenerateData({ ...generateData, month: e.target.value })}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text.secondary}`}>Year</label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    className={`w-full border rounded-lg px-3 py-2 ${themeClasses.input.bg} ${themeClasses.input.border} ${themeClasses.input.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    value={generateData.year}
                    onChange={(e) => setGenerateData({ ...generateData, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${themeClasses.text.secondary} ${darkMode ? "hover:bg-slate-800" : "hover:bg-violet-100"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayslip;
