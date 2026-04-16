import CampDesignApp from "@/components/camp-design-app";
import { getCampDesignInitialData } from "@/lib/app/camp-design-data";
import { getUserContext } from "@/lib/auth/user-context";

export default async function ProtectedLayout() {
  const userContext = await getUserContext();
  const initialData = await getCampDesignInitialData();

  return (
    <CampDesignApp
      initialData={initialData}
      profile={{
        userId: userContext.user.id,
        email: userContext.user.email ?? "Unknown",
        displayName: userContext.displayName,
        avatarUrl: userContext.avatarUrl,
        onboardingCompletedAt: userContext.onboardingCompletedAt,
        phone: userContext.phone,
        wardId: userContext.wardId,
        roleLabels: userContext.roleLabels,
        isLeader: userContext.isLeader,
        isStakeAdmin: userContext.isStakeAdmin,
        canManageContent: userContext.canManageContent,
        canManageUnits: userContext.canManageUnits,
        canManageRegistrations: userContext.canManageRegistrations,
        canAwardCompetitionPoints: userContext.canAwardCompetitionPoints,
        isCamper: userContext.isCamper,
        inviteType: userContext.inviteType,
      }}
    />
  );
}
