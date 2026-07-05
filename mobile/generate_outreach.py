import re

with open("c:/Users/Kunal/Desktop/Projects/HireCompass_App/mobile/app/(app)/outreach.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update imports
imports_to_add = """import { LinearGradient } from "expo-linear-gradient";
import { Zap, ClipboardList, Mailbox, TrendingUp, Building2, Rocket, Globe, Shield, Clock4 } from "lucide-react-native";
"""

code = code.replace('import { useSafeAreaInsets }', imports_to_add + 'import { useSafeAreaInsets }')

# 2. Extract logic part and return part
logic_match = re.search(r'(// ── Main render ─────────────────────────────────────────────────────────────)', code)
if not logic_match:
    print("Could not find Main render marker")
    exit(1)

logic_part = code[:logic_match.start()]

# Remove `useMemo` from the import if not there, let's just make sure it's in the React import
react_import = re.search(r'import React, \{ (.*?) \} from "react";', logic_part)
if react_import and "useMemo" not in react_import.group(1):
    logic_part = logic_part.replace(react_import.group(0), f'import React, {{ {react_import.group(1)}, useMemo }} from "react";')

new_render_part = """// ── Main render ─────────────────────────────────────────────────────────────

  const [campaignFilter, setCampaignFilter] = useState("All");
  
  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === "All") return campaigns;
    return campaigns.filter((c: any) => (c.status || "DRAFT").toUpperCase() === campaignFilter.toUpperCase());
  }, [campaigns, campaignFilter]);

  const getCampaignVisuals = (name: string) => {
    if (name.includes("Tech")) return { icon: Building2, subtitle: "FAANG + Tier-1", bg: "#E0E7FF", color: "#4F46E5" };
    if (name.includes("Startup")) return { icon: Rocket, subtitle: "Series A-C Startups", bg: "#DCFCE7", color: "#10B981" };
    if (name.includes("Remote")) return { icon: Globe, subtitle: "Remote-first companies", bg: "#FEF3C7", color: "#3B82F6" };
    if (name.includes("Fintech")) return { icon: Shield, subtitle: "Finance & Crypto", bg: "#F3E8FF", color: "#9333EA" };
    return { icon: Megaphone, subtitle: "Outreach Campaign", bg: Colors.primaryMuted, color: Colors.primary };
  };

  const getStatusVisuals = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REPLIED": return { bg: "#DCFCE7", text: "#16A34A", icon: CheckCircle, label: "Replied" };
      case "SENT": return { bg: "#E0E7FF", text: "#3B82F6", icon: Mail, label: "Sent" };
      case "SENDING": return { bg: "#FEF3C7", text: "#D97706", icon: Clock4, label: "Sending..." };
      case "DRAFT": return { bg: "#F1F5F9", text: "#64748B", icon: Clock4, label: "Draft" };
      default: return { bg: "#F1F5F9", text: "#64748B", icon: Clock4, label: status || "Draft" };
    }
  };

  const renderCampaignItem = ({ item }: { item: any }) => {
    const visuals = getCampaignVisuals(item.name || "");
    const status = getStatusVisuals(item.status || "DRAFT");
    const IconComponent = visuals.icon;
    const StatusIcon = status.icon;

    const isSending = (item.status || "").toUpperCase() === "SENDING";

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => openCampaignDetail(item)}>
        <Card variant="elevated" style={styles.newCampaignCard}>
          <View style={styles.newCampaignHeader}>
            <View style={[styles.newCampaignIconBox, { backgroundColor: visuals.bg }]}>
              <IconComponent size={20} color={visuals.color} />
            </View>
            <View style={styles.newCampaignInfo}>
              <Text style={styles.newCampaignName}>{item.name}</Text>
              <Text style={styles.newCampaignSubtitle}>{visuals.subtitle}</Text>
            </View>
            <View style={[styles.newStatusPill, { backgroundColor: status.bg }]}>
              <StatusIcon size={12} color={status.text} style={{ marginRight: 4 }} />
              <Text style={[styles.newStatusPillText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>
          
          <View style={styles.newCampaignStats}>
            <View style={styles.newStatItem}>
              <Users size={14} color={Colors.textMuted} />
              <Text style={styles.newStatLabel}>{item.totalRecords || 0} recruiters</Text>
            </View>
            <View style={styles.newStatItem}>
              <Mail size={14} color={Colors.textMuted} />
              <Text style={styles.newStatLabel}>{item.sentCount || 0} sent</Text>
            </View>
            {((item.status || "").toUpperCase() === "REPLIED" || item.repliedCount > 0) && (
              <View style={styles.newStatItem}>
                <CheckCircle size={14} color="#16A34A" />
                <Text style={[styles.newStatLabel, { color: "#16A34A" }]}>{item.repliedCount || 0} replied</Text>
              </View>
            )}
          </View>

          {isSending && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressTextLabel}>Sending...</Text>
                <Text style={styles.progressTextValue}>{item.sentCount || 0}/{item.totalRecords || 0}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, ((item.sentCount || 0) / (item.totalRecords || 1)) * 100)}%` }]} />
              </View>
            </View>
          )}

          {((item.status || "").toUpperCase() === "REPLIED" || item.repliedCount > 0) && !isSending && (
            <View style={styles.newCampaignFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TrendingUp size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.replyRateText}>
                  {Math.round(((item.repliedCount || 0) / (item.sentCount || 1)) * 100)}% reply rate
                </Text>
              </View>
              <Text style={styles.dateText}>• Jun 30</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <LinearGradient colors={['#0F9B8E', '#0372A5']} style={[styles.gradientHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Outreach</Text>
          <TouchableOpacity style={styles.newButton} onPress={() => { setImportedContacts([]); setCampaignModalVisible(true); }}>
            <Zap size={14} color="#FDB813" style={{ marginRight: 4 }} />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>AI-powered recruiter campaigns</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <ClipboardList size={16} color="#4F46E5" />
            </View>
            <Text style={styles.statNumberGlass}>4</Text>
            <Text style={styles.statLabelGlass}>Campaigns</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <Mailbox size={16} color="#E11D48" />
            </View>
            <Text style={styles.statNumberGlass}>54</Text>
            <Text style={styles.statLabelGlass}>Reached</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <CheckSquare size={16} color="#16A34A" />
            </View>
            <Text style={styles.statNumberGlass}>4</Text>
            <Text style={styles.statLabelGlass}>Replied</Text>
          </View>
          <View style={styles.statCardGlass}>
            <View style={styles.statIconWrapper}>
              <TrendingUp size={16} color="#9333EA" />
            </View>
            <Text style={styles.statNumberGlass}>31%</Text>
            <Text style={styles.statLabelGlass}>Open Rate</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        {["All", "Draft", "Sent", "Replied"].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterPill, campaignFilter === f && styles.filterPillActive]}
            onPress={() => setCampaignFilter(f)}
          >
            <Text style={[styles.filterPillText, campaignFilter === f && styles.filterPillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aiBannerContainer}>
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerIconBox}>
            <Zap size={18} color="#FFF" />
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>AI suggests 8 new targets</Text>
            <Text style={styles.aiBannerSubtitle}>Based on your recent interview success at Google</Text>
          </View>
          <ChevronRight size={20} color="#8B5CF6" />
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader()}
        refreshControl={<RefreshControl refreshing={isRefetchingCampaigns} onRefresh={refetchCampaigns} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create a new campaign to start sending outreach emails."
            actionLabel="New Campaign"
            onAction={() => { setImportedContacts([]); setCampaignModalVisible(true); }}
          />
        }
        renderItem={renderCampaignItem}
      />
"""

styles_match = re.search(r'const styles = StyleSheet.create\(\{', code)
if not styles_match:
    print("Could not find styles marker")
    exit(1)

modals_part = code[code.find('{/* ── Campaign Creation Modal ── */}'):styles_match.start()]

new_styles = """const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFF",
    letterSpacing: -0.5,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFF",
  },
  headerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statCardGlass: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumberGlass: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFF",
    marginBottom: 2,
  },
  statLabelGlass: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: "#00897B",
  },
  filterPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFF",
  },
  aiBannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  aiBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#6D28D9",
    marginBottom: 2,
  },
  aiBannerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8B5CF6",
  },
  listContent: {
    paddingBottom: 40,
  },
  newCampaignCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  newCampaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  newCampaignIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  newCampaignInfo: {
    flex: 1,
  },
  newCampaignName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 2,
  },
  newCampaignSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#94A3B8",
  },
  newStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newStatusPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  newCampaignStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  newStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#64748B",
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTextLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#94A3B8",
  },
  progressTextValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#D97706",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 2,
  },
  newCampaignFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  replyRateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#16A34A",
  },
  dateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#94A3B8",
    marginLeft: 8,
  },
"""

# Include old styles for modals that we didn't rewrite
old_styles_match = re.search(r'modalBg:.*?\}\);', code, re.DOTALL)
if old_styles_match:
    old_styles = old_styles_match.group(0)
    final_styles = new_styles + "\n  " + old_styles
else:
    final_styles = new_styles + "});"

with open("c:/Users/Kunal/Desktop/Projects/HireCompass_App/mobile/app/(app)/outreach.tsx", "w", encoding="utf-8") as f:
    f.write(logic_part + new_render_part + modals_part + "\n    </View>\n  );\n}\n\n" + final_styles)
    
print("Successfully generated and updated outreach.tsx")
