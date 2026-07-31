const axios = require('axios');

let csrfToken = '';

// Cookie gerektiren yazma (Rank değiştirme / Ban) işlemleri için Axios client'ı
const robloxClient = axios.create({
  baseURL: 'https://groups.roblox.com/v1',
  headers: {
    'Cookie': `.ROBLOSECURITY=${process.env.ROBLOX_COOKIE}`,
    'Content-Type': 'application/json'
  }
});

// Otomatik X-CSRF-TOKEN (XSRF) yakalama ve istek tekrarı mekanizması
robloxClient.interceptors.request.use(config => {
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});

robloxClient.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;
    // Roblox 403 verdiğinde yanıtın header kısmında yeni X-CSRF-TOKEN gönderir
    if (response && response.status === 403 && response.headers['x-csrf-token']) {
      csrfToken = response.headers['x-csrf-token'];
      config.headers['X-CSRF-TOKEN'] = csrfToken;
      return robloxClient(config); // İsteği yeni token ile otomatik tekrar dener
    }
    return Promise.reject(error);
  }
);

/**
 * Roblox kullanıcı adından Roblox ID bulur
 */
async function getUserIdByUsername(username) {
  try {
    const res = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: true
    });
    return res.data.data[0] ? res.data.data[0].id : null;
  } catch (e) {
    console.error('getUserIdByUsername Hatası:', e.response?.data || e.message);
    return null;
  }
}

/**
 * Roblox ID'sinden Kullanıcı Adı bulur
 */
async function getUsernameById(userId) {
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data.name;
  } catch (e) {
    console.error('getUsernameById Hatası:', e.response?.data || e.message);
    return null;
  }
}

/**
 * Kullanıcının Roblox profilindeki "Hakkında (About)" metnini getirir
 */
async function getUserBio(userId) {
  try {
    const res = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    return res.data.description || '';
  } catch (e) {
    console.error('getUserBio Hatası:', e.response?.data || e.message);
    return '';
  }
}

/**
 * Kullanıcının üye olduğu tüm grupları ve rütbelerini listeler
 */
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
    console.error('getUserGroups Hatası:', e.response?.data || e.message);
    return [];
  }
}

/**
 * Kullanıcının belirli bir gruptaki rütbe seviyesini (1-255) döndürür. Grupta yoksa 0 döner.
 */
async function getMemberRank(groupId, userId) {
  try {
    if (!groupId || !userId) return 0;

    const res = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    if (!res.data || !res.data.data) return 0;

    const hedefGrup = res.data.data.find(
      item => item.group && Number(item.group.id) === Number(groupId)
    );

    return hedefGrup ? hedefGrup.role.rank : 0;
  } catch (e) {
    console.error(`getMemberRank Hatası (Group: ${groupId}, User: ${userId}):`, e.response?.data || e.message);
    return 0;
  }
}

/**
 * Grubun tüm rütbelerini/rollerini getirir
 */
async function getGroupRoles(groupId) {
  try {
    const res = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
    return res.data.roles || [];
  } catch (e) {
    console.error('getGroupRoles Hatası:', e.response?.data || e.message);
    return [];
  }
}

/**
 * Kullanıcının gruptaki rütbesini değiştirir
 */
async function setRank(groupId, userId, rankLevel) {
  try {
    const roles = await getGroupRoles(groupId);
    const targetRole = roles.find(r => r.rank === Number(rankLevel) || r.id === Number(rankLevel));
    
    if (!targetRole) {
      console.error(`Rütbe bulunamadı: GroupID: ${groupId}, RankLevel: ${rankLevel}`);
      return false;
    }

    await robloxClient.patch(`/groups/${groupId}/users/${userId}`, {
      roleId: targetRole.id
    });
    return true;
  } catch (e) {
    console.error('Roblox setRank hatası:', e.response?.data || e.message);
    return false;
  }
}

/**
 * Rütbe adına göre gruptaki rütbe seviyesini (rank) bulur
 */
async function getRankLevelByName(groupId, rankName) {
  try {
    const roles = await getGroupRoles(groupId);
    const role = roles.find(r => r.name.toLowerCase() === rankName.toLowerCase());
    return role ? role.rank : null;
  } catch (e) {
    return null;
  }
}

/**
 * Kullanıcıyı gruptan sürgün eder / atar
 */
async function banFromGroup(groupId, userId) {
  try {
    await robloxClient.delete(`/groups/${groupId}/users/${userId}`);
    return true;
  } catch (e) {
    console.error('Roblox ban hatası:', e.response?.data || e.message);
    return false;
  }
}

/**
 * Grup duvarındaki son paylaşım tarihine bakarak aktiflik kontrol eder
 */
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

module.exports = {
  getUserIdByUsername,
  getUsernameById,
  getUserBio,
  getUserGroups,
  getMemberRank,
  setRank,
  getRankLevelByName,
  banFromGroup,
  getGroupActivity,
  getGroupRoles
};
