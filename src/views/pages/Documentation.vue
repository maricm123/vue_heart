<template>
    <div class="card">
        <div class="flex items-start justify-between gap-6 mb-6">
            <div>
                <div class="font-semibold text-2xl mb-1">Feature overview</div>
                <div class="text-lg opacity-80">Application Documentation</div>
            </div>

            <!-- Quick badges -->
            <div class="hidden md:flex gap-2">
                <span class="doc-badge doc-badge-info">Coach / Manager</span>
                <span class="doc-badge doc-badge-success">BLE Ready</span>
                <span class="doc-badge doc-badge-warn">Danger Zone</span>
            </div>
        </div>

        <div class="doc-grid">
            <!-- TOC -->
            <aside class="doc-toc hidden lg:block">
                <div class="doc-toc-inner">
                    <div class="font-semibold text-base mb-3">On this page</div>
                    <ul class="text-sm leading-7">
                        <li><a class="doc-link" href="#overview">Overview</a></li>
                        <li><a class="doc-link" href="#roles">User Roles</a></li>
                        <li><a class="doc-link" href="#profile">Coach Profile</a></li>
                        <li><a class="doc-link" href="#coach-tv">Coach TV Preview</a></li>
                        <li><a class="doc-link" href="#livetv">Live TV</a></li>
                        <li><a class="doc-link" href="#clients">Client List</a></li>
                        <li><a class="doc-link" href="#history">Training History</a></li>
                        <li><a class="doc-link" href="#add-client">Add New Client</a></li>
                        <li><a class="doc-link" href="#danger">Danger Zone</a></li>
                    </ul>
                </div>
            </aside>

            <!-- CONTENT -->
            <main class="doc-content">
                <!-- Overview -->
                <section id="overview" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Overview</div>
                        <div class="text-sm opacity-70">What this app is for</div>
                    </div>

                    <p class="text-lg leading-relaxed mb-4">
                        This application is designed <strong>exclusively for gym professionals</strong> and is intended to be used only by
                        <strong>Coaches</strong> and <strong>Gym Managers</strong>. Its main purpose is to support
                        <strong>live training sessions</strong>, <strong>client management</strong>, and <strong>real-time performance monitoring</strong>
                        using BLE-enabled devices.
                    </p>
                    <p class="text-lg leading-relaxed">
                        The system focuses on simplicity, real-time feedback, and clear separation between training execution and client data management.
                    </p>
                </section>

                <!-- Roles -->
                <section id="roles" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">User Roles</div>
                        <div class="text-sm opacity-70">Who can use the system</div>
                    </div>

                    <p class="text-lg mb-4">Currently, the application supports <strong>two user roles</strong>:</p>

                    <div class="doc-split">
                        <div class="doc-subcard">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-semibold text-base">Coach</div>
                                <span class="doc-pill">Primary role</span>
                            </div>
                            <ul class="leading-normal list-disc pl-6 text-lg">
                                <li>Manage and update their personal profile</li>
                                <li>Change their password at any time</li>
                                <li>Log out from the system</li>
                                <li>Permanently delete their profile if needed</li>
                                <li>Start and manage training sessions for clients</li>
                                <li>View live training metrics in real time</li>
                            </ul>
                        </div>

                        <div class="doc-subcard">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-semibold text-base">Manager</div>
                                <span class="doc-pill">Oversight</span>
                            </div>
                            <p class="text-lg leading-relaxed mb-3">
                                Managers have access to all coaching features and are typically responsible for overseeing client data and training history across the gym.
                            </p>

                            <div class="doc-callout doc-callout-info">
                                <div class="font-semibold mb-1">Note</div>
                                <div class="text-sm leading-relaxed">
                                    Only coaches and managers can access this application. There are no client-side user accounts.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Profile -->
                <section id="profile" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Coach Profile Management</div>
                        <div class="text-sm opacity-70">Account & security</div>
                    </div>

                    <p class="text-lg mb-4">Each coach has a dedicated profile page where they can:</p>
                    <ul class="leading-normal list-disc pl-8 text-lg mb-4">
                        <li>Update personal information</li>
                        <li>Change their account password</li>
                        <li>Log out from the system</li>
                        <li>Permanently delete their account</li>
                    </ul>

                    <div class="doc-callout doc-callout-warn">
                        <div class="font-semibold mb-1">Warning</div>
                        <div class="text-sm leading-relaxed">
                            Deleting a profile is irreversible and should be done with caution.
                        </div>
                    </div>
                </section>

                <!-- Coach TV -->
                <section id="coach-tv" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Coach TV Preview</div>
                        <div class="text-sm opacity-70">Connect to a BLE device</div>
                    </div>

                    <p class="text-lg mb-4">
                        The <strong>Coach TV Preview</strong> tab is used to connect the application to a client’s training device.
                    </p>

                    <ul class="leading-normal list-disc pl-8 text-lg mb-4">
                        <li>The client device <strong>must support BLE (Bluetooth Low Energy)</strong></li>
                        <li>Once connected, you can start a <strong>training session</strong> for that client</li>
                        <li>During the session, real-time data (such as heart rate) is streamed to the system</li>
                    </ul>

                    <div class="doc-callout doc-callout-success">
                        <div class="font-semibold mb-1">Tip</div>
                        <div class="text-sm leading-relaxed">
                            Use Coach TV Preview for setup/control and open Live TV on a second screen for a clean, big-display view.
                        </div>
                    </div>
                </section>

                <!-- Live TV -->
                <section id="livetv" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Live TV (Big Screen View)</div>
                        <div class="text-sm opacity-70">Distraction-free metrics</div>
                    </div>

                    <p class="text-lg mb-3">The <strong>Live TV</strong> view is available at:</p>
                    <pre class="app-code mb-4"><code>/livetv</code></pre>

                    <p class="text-lg mb-4">This screen is designed for large displays (TVs or external monitors).</p>
                    <ul class="leading-normal list-disc pl-8 text-lg">
                        <li>Shows live training metrics for the active client</li>
                        <li>Clean, distraction-free UI</li>
                        <li>Ideal for coaches to monitor performance during workouts</li>
                        <li>Intended to be used on a <strong>second screen</strong> while Coach TV Preview is used for control</li>
                    </ul>
                </section>

                <!-- Clients -->
                <section id="clients" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Client List</div>
                        <div class="text-sm opacity-70">Client management</div>
                    </div>

                    <p class="text-lg mb-4">
                        The <strong>Client List</strong> tab allows you to manage all your clients in one place.
                    </p>

                    <p class="text-lg mb-2">For each client, you can view:</p>
                    <ul class="leading-normal list-disc pl-8 text-lg">
                        <li>Personal information</li>
                        <li>Training history</li>
                        <li>Detailed metrics from previous sessions</li>
                        <li>Charts and performance data for each training session</li>
                    </ul>
                </section>

                <!-- History -->
                <section id="history" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Training History & Details</div>
                        <div class="text-sm opacity-70">Review progress</div>
                    </div>

                    <p class="text-lg mb-4">Each client’s training session includes:</p>
                    <ul class="leading-normal list-disc pl-8 text-lg mb-4">
                        <li>Session duration</li>
                        <li>Heart rate metrics</li>
                        <li>Charts and visualized performance data</li>
                    </ul>

                    <p class="text-lg">
                        You can review past sessions at any time to track progress and performance trends.
                    </p>
                </section>

                <!-- Add client -->
                <section id="add-client" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Adding a New Client</div>
                        <div class="text-sm opacity-70">Required info & Max HR</div>
                    </div>

                    <p class="text-lg mb-4">
                        When adding a new client, you should enter their personal and training-relevant information.
                    </p>

                    <div class="doc-subcard">
                        <div class="font-semibold text-base mb-2">Maximum Heart Rate (Max HR)</div>
                        <p class="text-lg mb-3">
                            A very important parameter is the client’s <strong>Maximum Heart Rate (Max HR)</strong>.
                        </p>
                        <ul class="leading-normal list-disc pl-6 text-lg mb-3">
                            <li>If the client’s Max Heart Rate is known, it should be entered manually</li>
                            <li>If it is not known, you can calculate it using the standard formula:</li>
                        </ul>
                        <pre class="app-code mb-0"><code>Max Heart Rate = 220 − age</code></pre>
                    </div>

                    <p class="text-lg mt-4">
                        This value is crucial for accurate heart-rate zones and training analysis.
                    </p>
                </section>

                <!-- Danger -->
                <section id="danger" class="doc-section">
                    <div class="doc-section-header">
                        <div class="font-semibold text-xl">Danger Zone</div>
                        <div class="text-sm opacity-70">Irreversible actions</div>
                    </div>

                    <p class="text-lg mb-4">
                        Both <strong>clients</strong> and <strong>training sessions</strong> can be permanently deleted.
                    </p>

                    <div class="doc-callout doc-callout-danger">
                        <div class="font-semibold mb-1">Warning</div>
                        <div class="text-sm leading-relaxed mb-2">
                            Actions in the Danger Zone are irreversible:
                        </div>
                        <ul class="list-disc pl-6 text-sm leading-relaxed">
                            <li>Deleting a client will remove all associated training data</li>
                            <li>Deleting a training session cannot be undone</li>
                        </ul>
                    </div>

                    <p class="text-lg mt-4">Proceed with caution.</p>
                </section>
            </main>
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* Offset for anchor jumps (top navigation / sticky header) */

/* Bonus: ako koristis native smooth scroll */
:global(html) {
    scroll-behavior: smooth;
    scroll-padding-top: 90px;
}

/* Layout */
.doc-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
}

.doc-toc-inner {
    position: sticky;
    top: 1rem;
    padding: 1rem;
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.08));
    border-radius: 12px;
    background: var(--surface-card, #fff);
}

.doc-link {
    display: inline-flex;
    width: 100%;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
    text-decoration: none;
    opacity: 0.85;
}
.doc-link:hover {
    opacity: 1;
    background: var(--surface-hover, rgba(0, 0, 0, 0.04));
}

/* Sections */
.doc-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.doc-section {
    scroll-margin-top: 90px; /* povecaj/smanji po visini tvoje top navigacije */
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.08));
    border-radius: 14px;
    background: var(--surface-card, #fff);
    padding: 1.25rem;
}

.doc-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px dashed var(--surface-border, rgba(0, 0, 0, 0.12));
}

/* Split cards */
.doc-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.doc-subcard {
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.08));
    border-radius: 12px;
    padding: 1rem;
    background: var(--surface-ground, rgba(0, 0, 0, 0.02));
}

/* Pills / badges */
.doc-pill {
    font-size: 12px;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.12));
    opacity: 0.85;
}

.doc-badge {
    font-size: 12px;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.12));
    background: var(--surface-ground, rgba(0, 0, 0, 0.02));
}
.doc-badge-info {
    border-left: 4px solid #3b82f6;
}
.doc-badge-success {
    border-left: 4px solid #22c55e;
}
.doc-badge-warn {
    border-left: 4px solid #f59e0b;
}

/* Callouts */
.doc-callout {
    border-radius: 12px;
    padding: 0.9rem 1rem;
    border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.12));
    background: var(--surface-ground, rgba(0, 0, 0, 0.02));
}
.doc-callout-info {
    border-left: 4px solid #3b82f6;
}
.doc-callout-success {
    border-left: 4px solid #22c55e;
}
.doc-callout-warn {
    border-left: 4px solid #f59e0b;
}
.doc-callout-danger {
    border-left: 4px solid #ef4444;
}

/* Responsive */
@media screen and (max-width: 1024px) {
    .doc-grid {
        grid-template-columns: 1fr;
    }
}
@media screen and (max-width: 991px) {
    .doc-split {
        grid-template-columns: 1fr;
    }

    .video-container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 56.25%;

        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }
}
</style>
