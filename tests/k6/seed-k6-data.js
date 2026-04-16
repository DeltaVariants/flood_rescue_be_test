/**
 * Seed dữ liệu test cho k6 Performance Testing
 *
 * Chạy: node tests/k6/seed-k6-data.js
 * Yêu cầu: Server phải đang chạy ở localhost:8080
 *
 * Tạo:
 * - 20 Citizen accounts  (k6_citizen_1@test.com → k6_citizen_20@test.com)
 * - 1 Coordinator account (k6_coordinator@test.com)
 * - 1 Admin account       (k6_admin@test.com)
 * - Password cho tất cả:  Test123!
 */

const BASE_URL = "http://localhost:8080";
const PASSWORD = "Test123!";

async function registerUser(userData) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function seedK6Data() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   🌱 k6 Performance Test - Data Seeding       ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log();

  // --- Check server connectivity ---
  try {
    const ping = await fetch(`${BASE_URL}/ping`);
    if (!ping.ok) throw new Error("Server not responding");
    console.log("✅ Server is running at", BASE_URL);
  } catch {
    console.error("❌ Cannot connect to server at", BASE_URL);
    console.error("   Please start the server first: npm run dev");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // --- Create 20 Citizens ---
  console.log("\n📋 Creating 20 Citizen accounts...");
  for (let i = 1; i <= 20; i++) {
    const result = await registerUser({
      userName: `k6_citizen_${i}`,
      displayName: `K6 Citizen ${i}`,
      email: `k6_citizen_${i}@test.com`,
      phoneNumber: `08${String(i).padStart(9, "0")}`,
      password: PASSWORD,
      role: "Citizen",
    });

    if (result.success) {
      process.stdout.write(`  ✅ k6_citizen_${i}`);
      created++;
    } else if (
      result.data?.message?.includes("đã được sử dụng") ||
      result.data?.message?.includes("already")
    ) {
      process.stdout.write(`  ⏭️  k6_citizen_${i} (exists)`);
      skipped++;
    } else {
      process.stdout.write(
        `  ❌ k6_citizen_${i}: ${result.data?.message || result.error}`
      );
      failed++;
    }

    // Print 5 per line
    if (i % 5 === 0) console.log();
  }

  // --- Create 1 Coordinator ---
  console.log("\n📋 Creating Coordinator account...");
  const coordResult = await registerUser({
    userName: "k6_coordinator",
    displayName: "K6 Coordinator",
    email: "k6_coordinator@test.com",
    phoneNumber: "0899900001",
    password: PASSWORD,
    role: "Rescue Coordinator",
  });

  if (coordResult.success) {
    console.log("  ✅ k6_coordinator@test.com");
    created++;
  } else if (
    coordResult.data?.message?.includes("đã được sử dụng") ||
    coordResult.data?.message?.includes("already")
  ) {
    console.log("  ⏭️  k6_coordinator@test.com (exists)");
    skipped++;
  } else {
    console.log(
      "  ❌ k6_coordinator:",
      coordResult.data?.message || coordResult.error
    );
    failed++;
  }

  // --- Create 1 Admin ---
  console.log("\n📋 Creating Admin account...");
  const adminResult = await registerUser({
    userName: "k6_admin",
    displayName: "K6 Admin",
    email: "k6_admin@test.com",
    phoneNumber: "0899900002",
    password: PASSWORD,
    role: "Admin",
  });

  if (adminResult.success) {
    console.log("  ✅ k6_admin@test.com");
    created++;
  } else if (
    adminResult.data?.message?.includes("đã được sử dụng") ||
    adminResult.data?.message?.includes("already")
  ) {
    console.log("  ⏭️  k6_admin@test.com (exists)");
    skipped++;
  } else {
    console.log(
      "  ❌ k6_admin:",
      adminResult.data?.message || adminResult.error
    );
    failed++;
  }

  // --- Verify login works ---
  console.log("\n🔑 Verifying login...");
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "k6_citizen_1@test.com",
        password: PASSWORD,
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.data?.accessToken) {
      console.log("  ✅ Login verified successfully");
    } else {
      console.log("  ⚠️  Login returned:", loginData.message);
    }
  } catch (error) {
    console.log("  ❌ Login verification failed:", error.message);
  }

  // --- Summary ---
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   📊 Seed Summary                              ║");
  console.log("╠════════════════════════════════════════════════╣");
  console.log(`║   ✅ Created: ${String(created).padEnd(33)}║`);
  console.log(`║   ⏭️  Skipped: ${String(skipped).padEnd(33)}║`);
  console.log(`║   ❌ Failed:  ${String(failed).padEnd(33)}║`);
  console.log("╠════════════════════════════════════════════════╣");
  console.log("║   📝 Credentials:                              ║");
  console.log("║   Email: k6_citizen_{1-20}@test.com            ║");
  console.log("║   Email: k6_coordinator@test.com               ║");
  console.log("║   Email: k6_admin@test.com                     ║");
  console.log("║   Password: Test123!                           ║");
  console.log("╚════════════════════════════════════════════════╝");

  if (failed > 0) {
    process.exit(1);
  }
}

seedK6Data();
