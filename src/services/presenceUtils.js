export const uniquePresenceMembers = (members = []) => {
  const uniqueMembers = new Map();
  members.forEach((member) => {
    const identity = member.userId ?? member.username ?? member.email
      ?? `${member.role || ''}:${member.displayName || member.connectionId || ''}`;
    if (!uniqueMembers.has(identity)) uniqueMembers.set(identity, member);
  });
  return [...uniqueMembers.values()];
};
