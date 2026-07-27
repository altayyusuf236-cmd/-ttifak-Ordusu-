const axios = require('axios');
const robloxClient = axios.create({
  baseURL: 'https://groups.roblox.com/v1',
  headers: {
    'Cookie': `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
    'Content-Type': 'application/json'
  }
});

async function getUserIdByUsername(username) {
  try {
    const res = await axios.get(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
    return res.data.Id;
  } catch (e) {
    return null;
  }
}

async function getUsernameById(userId) {
  try {
    const res = await axios.get(`https://api.roblox.com/users/${userId}`);
    return res.data.Username;
  } catch (e) {
    return null;
  }
}

// YENİ: Roblox kullanıcısının bio'sunu (açıklama) getirir
async function getUserBio(userId) {
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data.description || '';
  } catch (e) {
    return null;
  }
}

// ... (diğer fonksiyonlar aynen)
async function getUserGroups(userId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    return res.data.data.map(item => ({
      groupId: item.group.id,
      groupName: item.group.name,
      roleName: item.role.name,
      roleRank: item.role.rank
    }));
  } catch (e) {
    return [];
  }
}

async function getMemberRank(groupId, userId) {
  try {
    const res = await robloxClient.get(`/groups/${groupId}/users/${userId}`);
    return res.data.role ? res.data.role.rank : 0;
  } catch (e) {
    return null;
  }
}

async function setRank(groupId, userId, rankLevel) {
  try {
    await robloxClient.patch(`/groups/${groupId}/users/${userId}`, {
      roleId: rankLevel
    });
    return true;
  } catch (e) {
    console.error('Roblox rank hatası:', e.response?.data || e.message);
    return false;
  }
}

async function getRankLevelByName(groupId, rankName) {
  try {
    const res = await robloxClient.get(`/groups/${groupId}/roles`);
    const role = res.data.roles.find(r => r.name.toLowerCase() === rankName.toLowerCase());
    return role ? role.rank : null;
  } catch (e) {
    return null;
  }
}

async function banFromGroup(groupId, userId) {
  try {
    await robloxClient.delete(`/groups/${groupId}/users/${userId}`);
    return true;
  } catch (e) {
    console.error('Roblox ban hatası:', e.response?.data || e.message);
    return false;
  }
}

async function getGroupActivity(groupId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/wall/posts?limit=1`);
    const lastPost = res.data.data[0]?.created;
    if (!lastPost) return false;
    const diff = Date.now() - new Date(lastPost).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
}

async function getGroupRoles(groupId) {
  try {
    const res = await robloxClient.get(`/groups/${groupId}/roles`);
    return res.data.roles;
  } catch (e) {
    return [];
  }
}

module.exports = {
  getUserIdByUsername,
  getUsernameById,
  getUserBio,           // YENİ
  getUserGroups,
  getMemberRank,
  setRank,
  getRankLevelByName,
  banFromGroup,
  getGroupActivity,
  getGroupRoles
};