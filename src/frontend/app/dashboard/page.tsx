"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  Stethoscope,
  Activity,
  FileText,
  ChevronRight,
  Loader2,
} from "lucide-react"

// Add domain types and typed mock API
type Patient = {
	id: string
	name: string
	nextAppt: string
	condition: string
	status: "critical" | "monitoring" | "stable" | "healthy" | string
}

type Appointment = {
	id: string
	patientName: string
	time: string
	type: string
	duration: string
}

type Message = {
	id: string
	from: string
	subject: string
	time: string
	unread: boolean
}

// Define API response data types
interface PatientsResponse {
	patients: Array<{
		_id?: string;
		id?: string;
		firstName?: string;
		lastName?: string;
		nextAppointment?: string;
		condition?: string;
		status?: string;
	}>;
}

interface AppointmentsResponse {
	appointments: Array<{
		_id?: string;
		id?: string;
		patientName?: string;
		time?: string;
		appointmentTime?: string;
		type?: string;
		appointmentType?: string;
		duration?: string;
	}>;
}

interface MessagesResponse {
	messages: Array<{
		_id?: string;
		id?: string;
		sender?: string;
		from?: string;
		subject?: string;
		createdAt?: string;
		read?: boolean;
		unread?: boolean;
	}>;
}

// Real API integration
const loadDashboardData = {
	async getPatients(): Promise<Patient[]> {
		try {
			const response = await apiClient.getPatients();
			if (response.success && response.data) {
				const data = response.data as PatientsResponse;
				if (Array.isArray(data.patients)) {
					// Transform backend data to match frontend interface
					return data.patients.map((patient) => ({
						id: patient._id || patient.id || '',
						name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient',
						nextAppt: patient.nextAppointment || "TBD",
						condition: patient.condition || "N/A",
						status: patient.status || "stable"
					}));
				}
			}
			return [];
		} catch (error) {
			console.error('Failed to load patients:', error);
			return [];
		}
	},

	async getAppointments(): Promise<Appointment[]> {
		try {
			const response = await apiClient.getAppointments();
			if (response.success && response.data) {
				const data = response.data as AppointmentsResponse;
				if (Array.isArray(data.appointments)) {
					return data.appointments.map((appt) => ({
						id: appt._id || appt.id || '',
						patientName: appt.patientName || "Unknown Patient",
						time: appt.time || appt.appointmentTime || "TBD",
						type: appt.type || appt.appointmentType || "Consultation",
						duration: appt.duration || "30 min"
					}));
				}
			}
			return [];
		} catch (error) {
			console.error('Failed to load appointments:', error);
			return [];
		}
	},

	async getMessages(): Promise<Message[]> {
		try {
			const response = await apiClient.getMessages();
			if (response.success && response.data) {
				const data = response.data as MessagesResponse;
				if (Array.isArray(data.messages)) {
					return data.messages.map((msg) => ({
						id: msg._id || msg.id || '',
						from: msg.sender || msg.from || "Unknown",
						subject: msg.subject || "No Subject",
						time: msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "Unknown",
						unread: msg.read === false || msg.unread === true
					}));
				}
			}
			return [];
		} catch (error) {
			console.error('Failed to load messages:', error);
			return [];
		}
	},
}

export default function TMISDashboard() {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [user, setUser] = useState<{
		id: string;
		email: string;
		username: string;
		firstName: string;
		lastName: string;
		role: string;
	} | null>(null)
	const [activeSection, setActiveSection] = useState<string>("dashboard")
	const [patients, setPatients] = useState<Patient[]>([])
	const [appointments, setAppointments] = useState<Appointment[]>([])
	const [messages, setMessages] = useState<Message[]>([])
	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
	const [isTimerRunning, setIsTimerRunning] = useState(false)
	const [timerTime, setTimerTime] = useState("01:24:08")

	// Check authentication on component mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				console.log('Checking authentication...')

				if (!apiClient.isAuthenticated()) {
					console.log('No auth token found, redirecting to login...')
					router.push('/login')
					return
				}

				// Verify authentication using the proper method
				console.log('Verifying token validity...')
				const isAuthValid = await apiClient.verifyAuthentication()

				if (isAuthValid) {
					// Get user profile for dashboard data
					const profileResponse = await apiClient.getProfile()
					if (profileResponse.success && profileResponse.data?.user) {
						setIsAuthenticated(true)
						setUser(profileResponse.data.user)
						console.log('Authentication verified, loading dashboard...')
					} else {
						console.log('Profile fetch failed, redirecting to login...')
						router.push('/login')
						return
					}
				} else {
					console.log('Token verification failed, redirecting to login...')
					router.push('/login')
					return
				}
			} catch (error) {
				console.error('Authentication check failed:', error)
				router.push('/login')
				return
			} finally {
				setIsLoading(false)
			}
		}

		checkAuth()
	}, [router])

	// Load initial data when authenticated
	useEffect(() => {
		if (isAuthenticated) {
			loadDashboardData.getPatients().then(setPatients)
			loadDashboardData.getAppointments().then(setAppointments)
			loadDashboardData.getMessages().then(setMessages)
		}
	}, [isAuthenticated])

	// Handle logout
	const handleLogout = async () => {
		try {
			await apiClient.logout()
			router.push('/login')
		} catch (error) {
			console.error('Logout error:', error)
			// Force redirect even if logout fails
			router.push('/login')
		}
	}

	const sidebarItems = [
		{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
		{ id: "patients", label: "Patients", icon: Users },
		{ id: "appointments", label: "Appointments", icon: Calendar },
		{ id: "messages", label: "Messages", icon: MessageSquare, badge: 3 },
		{ id: "analytics", label: "Analytics", icon: Activity },
		{ id: "settings", label: "Settings", icon: Settings },
		{ id: "help", label: "Help", icon: HelpCircle },
	]

	const handlePatientClick = (patient: Patient) => {
		setSelectedPatient(patient)
		setActiveSection("patient-detail")
	}

	const getStatusColor = (status: Patient["status"]) => {
		switch (status) {
			case "critical":
				return "bg-red-500"
			case "monitoring":
				return "bg-yellow-500"
			case "stable":
				return "bg-green-500"
			case "healthy":
				return "bg-blue-500"
			default:
				return "bg-gray-500"
		}
	}

	// Show loading screen while checking authentication
	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
					<p className="text-gray-600">Loading dashboard...</p>
				</div>
			</div>
		)
	}

	// Show unauthorized message if not authenticated
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
					<p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
					<Button onClick={() => router.push('/login')}>
						Go to Login
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white flex" role="main">
			{/* Sidebar */}
			<aside
				className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col z-10"
				role="navigation"
				aria-label="Main navigation"
			>
				{/* Logo */}
				<div className="p-6 border-b border-gray-200 flex-shrink-0">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
							<Stethoscope className="h-5 w-5 text-white" />
						</div>
						<span className="text-xl font-bold text-gray-900">TMIS</span>
					</div>
				</div>

				{/* Navigation Menu */}
				<nav className="flex-1 p-4 overflow-y-auto" role="menubar">
					<div className="space-y-1">
						{sidebarItems.map((item) => (
							<button
								key={item.id}
								onClick={() => setActiveSection(item.id)}
								className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
									activeSection === item.id
										? "bg-green-50 text-green-700 border-l-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
								}`}
								role="menuitem"
								aria-current={activeSection === item.id ? "page" : undefined}
							>
								<div className="flex items-center space-x-3">
									<item.icon className="h-5 w-5" aria-hidden="true" />
									<span className="font-medium">{item.label}</span>
								</div>
								{item.badge && (
									<Badge
										variant="secondary"
										className="bg-green-100 text-green-800"
										aria-label={`${item.badge} unread`}
									>
										{item.badge}
									</Badge>
								)}
							</button>
						))}
					</div>
				</nav>

				{/* Logout */}
				<div className="p-4 border-t border-gray-200 flex-shrink-0">
					<Button
						variant="ghost"
						className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
						role="menuitem"
						onClick={handleLogout}
					>
						<LogOut className="h-5 w-5 mr-3" aria-hidden="true" />
						Logout
					</Button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col overflow-hidden ml-64">
				{/* Header */}
				<header className="bg-white border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{activeSection === "dashboard"
									? "Dashboard"
									: activeSection === "patient-detail"
										? "Patient Details"
										: activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
							</h1>
							<p className="text-gray-600">
								Welcome back, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}
								{user?.role && ` - ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`}
							</p>
						</div>

						<div className="flex items-center space-x-4">
							<Button variant="outline" size="sm">
								<Search className="h-4 w-4 mr-2" />
								Search
							</Button>
							<Button variant="outline" size="sm">
								<Bell className="h-4 w-4" />
							</Button>
							<Avatar>
								<AvatarImage src="/caring-doctor.png" alt="Dr. Sarah Mitchell" />
								<AvatarFallback>SM</AvatarFallback>
							</Avatar>
						</div>
					</div>
				</header>

				{/* Dashboard Content */}
				<div className="flex-1 overflow-auto p-6">
					{activeSection === "dashboard" && (
						<div className="space-y-6">
							{/* Stats Cards */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Total Patients</CardTitle>
										<Users className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-green-600">247</div>
										<p className="text-xs text-muted-foreground">+12% from last month</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
										<Calendar className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-blue-600">18</div>
										<p className="text-xs text-muted-foreground">3 completed, 15 remaining</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
										<Activity className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-red-600">4</div>
										<p className="text-xs text-muted-foreground">Requires immediate attention</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
										<MessageSquare className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-purple-600">7</div>
										<p className="text-xs text-muted-foreground">2 urgent, 5 routine</p>
									</CardContent>
								</Card>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Patient List */}
								<Card className="lg:col-span-2">
									<CardHeader className="flex flex-row items-center justify-between">
										<div>
											<CardTitle>Recent Patients</CardTitle>
											<CardDescription>Your most recent patient interactions</CardDescription>
										</div>
										<Button size="sm">
											<Plus className="h-4 w-4 mr-2" />
											Add Patient
										</Button>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{patients.slice(0, 5).map((patient) => (
												<div
													key={patient.id}
													className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
													onClick={() => handlePatientClick(patient)}
													role="button"
													tabIndex={0}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															handlePatientClick(patient)
														}
													}}
												>
													<div className="flex items-center space-x-3">
														<Avatar>
															<AvatarFallback>
																{patient.name
																	.split(" ")
																	.map((n: string) => n[0])
																	.join("")}
															</AvatarFallback>
														</Avatar>
														<div>
															<p className="font-medium">{patient.name}</p>
															<p className="text-sm text-gray-500">ID: {patient.id}</p>
														</div>
													</div>
													<div className="flex items-center space-x-3">
														<div className="text-right">
															<p className="text-sm font-medium">{patient.condition}</p>
															<p className="text-xs text-gray-500">Next: {patient.nextAppt}</p>
														</div>
														<div
															className={`w-3 h-3 rounded-full ${getStatusColor(patient.status)}`}
															title={`Status: ${patient.status}`}
														></div>
														<ChevronRight className="h-4 w-4 text-gray-400" />
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>

								{/* Time Tracker & Quick Actions */}
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center justify-between">
												Time Tracker
												<Clock className="h-5 w-5 text-gray-500" />
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-center">
												<div className="text-3xl font-mono font-bold text-green-600 mb-4">{timerTime}</div>
												<div className="flex justify-center space-x-2">
													<Button
														size="sm"
														variant={isTimerRunning ? "secondary" : "default"}
														onClick={() => setIsTimerRunning(!isTimerRunning)}
													>
														{isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
													</Button>
													<Button size="sm" variant="outline">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Today's Schedule</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{appointments.map((appt) => (
													<div key={appt.id} className="flex items-center justify-between text-sm">
														<div>
															<p className="font-medium">{appt.time}</p>
															<p className="text-gray-500">{appt.patientName}</p>
														</div>
														<Badge variant="outline">{appt.type}</Badge>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Messages Section */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										Secure Messages
										<Button size="sm" variant="outline">
											View All
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{messages.slice(0, 3).map((message) => (
											<div key={message.id} className="flex items-center justify-between p-3 rounded-lg border">
												<div className="flex items-center space-x-3">
													<div
														className={`w-2 h-2 rounded-full ${message.unread ? "bg-blue-500" : "bg-gray-300"}`}
													></div>
													<div>
														<p className="font-medium">{message.from}</p>
														<p className="text-sm text-gray-600">{message.subject}</p>
													</div>
												</div>
												<span className="text-xs text-gray-500">{message.time}</span>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Patient Detail View */}
					{activeSection === "patient-detail" && selectedPatient && (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<Button variant="ghost" onClick={() => setActiveSection("dashboard")} className="mb-4">
									← Back to Dashboard
								</Button>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<Card className="lg:col-span-2">
									<CardHeader>
										<CardTitle className="flex items-center space-x-3">
											<Avatar className="h-12 w-12">
												<AvatarFallback className="text-lg">
													{selectedPatient.name
														.split(" ")
														.map((n: string) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<div>
												<h2 className="text-xl">{selectedPatient.name}</h2>
												<p className="text-gray-500">Patient ID: {selectedPatient.id}</p>
											</div>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<h3 className="font-semibold mb-2">Medical Information</h3>
												<div className="space-y-2 text-sm">
													<div className="flex justify-between">
														<span className="text-gray-600">Primary Condition:</span>
														<span className="font-medium">{selectedPatient.condition}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-gray-600">Status:</span>
														<Badge className={getStatusColor(selectedPatient.status)}>{selectedPatient.status}</Badge>
													</div>
													<div className="flex justify-between">
														<span className="text-gray-600">Last Consultation:</span>
														<span>12 Oct 2024</span>
													</div>
													<div className="flex justify-between">
														<span className="text-gray-600">Medication:</span>
														<span>Lisinopril 10mg</span>
													</div>
												</div>
											</div>
											<div>
												<h3 className="font-semibold mb-2">Upcoming Appointments</h3>
												<div className="space-y-2 text-sm">
													<div className="p-2 bg-gray-50 rounded">
														<p className="font-medium">{selectedPatient.nextAppt}</p>
														<p className="text-gray-600">Follow-up Consultation</p>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Quick Actions</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<Button className="w-full justify-start">
											<FileText className="h-4 w-4 mr-2" />
											View Medical Records
										</Button>
										<Button variant="outline" className="w-full justify-start bg-transparent">
											<Calendar className="h-4 w-4 mr-2" />
											Schedule Appointment
										</Button>
										<Button variant="outline" className="w-full justify-start bg-transparent">
											<MessageSquare className="h-4 w-4 mr-2" />
											Send Message
										</Button>
									</CardContent>
								</Card>
							</div>
						</div>
					)}

					{/* Other sections placeholder */}
					{!["dashboard", "patient-detail"].includes(activeSection) && (
						<Card>
							<CardHeader>
								<CardTitle className="capitalize">{activeSection}</CardTitle>
								<CardDescription>
									This section is under development. Full functionality will be available soon.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">
									The {activeSection} module will provide comprehensive tools for managing your medical practice.
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		</div>
	)
}
